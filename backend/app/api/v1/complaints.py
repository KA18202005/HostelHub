from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.complaint import Complaint
from app.models.room import Room
from app.models.user import User
from app.auth.roles import require_role
from app.enums.roles import UserRole
from app.enums.complaint_status import ComplaintStatus
from app.services.ai.complaint_classifier import classify_complaint
from app.enums.complaint_category import ComplaintCategory
from app.enums.complaint_priority import ComplaintPriority
from app.services.notification_service import create_notification
from app.models.complaint_history import ComplaintHistory
from app.schemas.complaint import ComplaintHistoryRead
from app.services.complaint_history_service import create_history
from app.schemas.complaint import PaginatedComplaintRead
from app.services.staff_assignment_service import get_least_loaded_staff
from app.services.complaint_priority_service import requires_escalation
from app.services.complaint_duplicate_service import (
    check_for_duplicate_complaint,
)
from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCreate,
    ComplaintRead,
    ComplaintStatusUpdate,
    ComplaintUpdate,
)
from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select
from uuid import UUID
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

VALID_STATUS_TRANSITIONS = {
    ComplaintStatus.OPEN: {
        ComplaintStatus.ASSIGNED,
    },
    ComplaintStatus.ASSIGNED: {
        ComplaintStatus.IN_PROGRESS,
    },
    ComplaintStatus.IN_PROGRESS: {
        ComplaintStatus.RESOLVED,
    },
    ComplaintStatus.RESOLVED: {
        ComplaintStatus.CLOSED,
    },
    ComplaintStatus.CLOSED: set(),
}


router = APIRouter(
    prefix="/api/v1/complaints",
    tags=["Complaints"],
)


@router.post(
    "",
    response_model=ComplaintRead,
    status_code=status.HTTP_201_CREATED,
)
def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Resolve the student's human-readable room details
    # into the actual Room UUID stored in the database.
    
    if current_user.role == UserRole.STUDENT:
        if current_user.room_id is None:
            raise HTTPException(
                status_code=400,
                detail="You have not been assigned a room yet",
            )

        room = session.get(Room, current_user.room_id)

        if room is None:
            raise HTTPException(
                status_code=400,
                detail="Your assigned room could not be found",
            )
    else:
        room_query = select(Room).where(
            Room.block == complaint_data.block.upper(),
            Room.floor == complaint_data.floor,
            Room.room_number == complaint_data.room_number,
        )

        if complaint_data.apartment:
            room_query = room_query.where(
                Room.apartment == complaint_data.apartment.upper()
            )
        else:
            room_query = room_query.where(
                Room.apartment == None
            )

        room = session.exec(room_query).first()

        if room is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found for the selected block, floor, apartment and room number.",
        )

    duplicate_result = check_for_duplicate_complaint(
        session=session,
        room_id=room.id,
        title=complaint_data.title,
        description=complaint_data.description,
    )

    if duplicate_result.is_duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "A similar active complaint already exists.",
                "similar_complaint_id": str(
                    duplicate_result.similar_complaint_id
                ),
                "confidence": duplicate_result.confidence,
                "reason": duplicate_result.reason,
            },
        )

    classification = None

    try:
        classification = classify_complaint(
            title=complaint_data.title,
            description=complaint_data.description,
        )
    except Exception:
        classification = None

    if complaint_data.category is not None:
        category = complaint_data.category
    elif classification is not None:
        category = classification.category
    else:
        category = ComplaintCategory.OTHER

    if complaint_data.priority is not None:
        priority = complaint_data.priority
    elif classification is not None:
        priority = classification.priority
    else:
        priority = ComplaintPriority.MEDIUM

    ai_reason = (
        classification.reason
        if classification is not None
        else None
    )

    complaint = Complaint(
        title=complaint_data.title,
        description=complaint_data.description,
        category=category,
        priority=priority,
        ai_reason=ai_reason,
        room_id=room.id,
        reported_by_id=current_user.id,
    )

    session.add(complaint)
    session.flush()

    # Record complaint creation
    create_history(
        session=session,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="CREATED",
        old_value=None,
        new_value=complaint.status.value,
    )

    # Find the least-loaded staff member
    staff_user = get_least_loaded_staff(session)

    if staff_user is not None:
        complaint.assigned_to_id = staff_user.id
        complaint.status = ComplaintStatus.ASSIGNED
        
        create_notification(
            session=session,
            user_id=staff_user.id,
            title="Complaint Assigned to You",
            message=(
                f'Complaint "{complaint.title}" '
                f'has been assigned to you.'
            ),
        )

        create_history(
            session=session,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action="ASSIGNED",
            old_value=None,
            new_value=str(staff_user.id),
        )

        create_notification(
            session=session,
            user_id=current_user.id,
            title="Complaint Assigned",
            message=(
                f"Your complaint '{complaint.title}' "
                f"has been automatically assigned to "
                f"{staff_user.name}."
            ),
        )
        

        if requires_escalation(complaint.priority):
            admin_users = session.exec(
                select(User).where(
                    User.role == UserRole.ADMIN,
                    User.is_active == True,
                )
            ).all()

            for admin_user in admin_users:
                create_notification(
                    session=session,
                    user_id=admin_user.id,
                    title="Priority Complaint Alert",
                    message=(
                        f"{complaint.priority.value} priority complaint "
                        f"'{complaint.title}' has been assigned to "
                        f"{staff_user.name}."
                    ),
                )

    session.commit()
    session.refresh(complaint)

    return ComplaintRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_reason=complaint.ai_reason,
        room_id=room.id,
        block=room.block,
        floor=room.floor,
        room_number=room.room_number,
        apartment=room.apartment,
        reported_by_id=complaint.reported_by_id,
        reported_by_name=current_user.name,
        reported_by_email=current_user.email,
        assigned_to_id=complaint.assigned_to_id,
    )




@router.get(
    "",
    response_model=PaginatedComplaintRead,
)
def get_my_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    offset = (page - 1) * limit

    total = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.reported_by_id == current_user.id
        )
    ).one()

    statement = (
        select(Complaint)
        .where(
            Complaint.reported_by_id == current_user.id
        )
        .options(
            selectinload(Complaint.room)
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    complaints = session.exec(statement).all()

    items = [
        ComplaintRead(
            id=complaint.id,
            title=complaint.title,
            description=complaint.description,
            category=complaint.category,
            priority=complaint.priority,
            status=complaint.status,
            ai_reason=complaint.ai_reason,
            room_id=complaint.room_id,
            block=complaint.room.block,
            floor=complaint.room.floor,
            room_number=complaint.room.room_number,
            apartment=complaint.room.apartment,
            reported_by_name=current_user.name,
            reported_by_email=current_user.email,
            reported_by_id=complaint.reported_by_id,
            assigned_to_id=complaint.assigned_to_id,
        )
        for complaint in complaints
    ]

    pages = (total + limit - 1) // limit

    return PaginatedComplaintRead(
        items=items,
        page=page,
        limit=limit,
        total=total,
        pages=pages,
    )
    

@router.get(
    "/all",
    response_model=PaginatedComplaintRead,
)
def get_all_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(
        require_role(
            UserRole.STAFF,
            UserRole.ADMIN,
        )
    ),
    session: Session = Depends(get_session),
):
    offset = (page - 1) * limit

    total = session.exec(
        select(func.count(Complaint.id))
    ).one()

    statement = (
        select(Complaint)
        .options(
            selectinload(Complaint.room),
            selectinload(Complaint.reported_by),
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    complaints = session.exec(statement).all()

    items = [
        ComplaintRead(
            id=complaint.id,
            title=complaint.title,
            description=complaint.description,
            category=complaint.category,
            priority=complaint.priority,
            status=complaint.status,
            ai_reason=complaint.ai_reason,
            room_id=complaint.room_id,
            block=complaint.room.block,
            floor=complaint.room.floor,
            room_number=complaint.room.room_number,
            apartment=complaint.room.apartment,
            reported_by_id=complaint.reported_by_id,
            reported_by_name=complaint.reported_by.name,
            reported_by_email=complaint.reported_by.email,
            assigned_to_id=complaint.assigned_to_id,
        )
        for complaint in complaints
    ]

    pages = (total + limit - 1) // limit

    return PaginatedComplaintRead(
        items=items,
        page=page,
        limit=limit,
        total=total,
        pages=pages,
    )


@router.patch(
    "/{complaint_id}/assign",
    response_model=ComplaintRead,
)
def assign_complaint(
    complaint_id: UUID,
    assignment: ComplaintAssign,
    current_user: User = Depends(
        require_role(
            UserRole.STAFF,
            UserRole.ADMIN,
        )
    ),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.status in (
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved or closed complaints cannot be assigned",
        )

    staff_user = session.exec(
        select(User).where(
            User.id == assignment.assigned_to_id,
            User.role.in_(
                [
                    UserRole.STAFF,
                    UserRole.ADMIN,
                ]
            ),
            User.is_active.is_(True),
        )
    ).first()

    if staff_user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint can only be assigned to an active staff or admin user",
        )

    old_assigned_to_id = complaint.assigned_to_id

    complaint.assigned_to_id = staff_user.id
    complaint.status = ComplaintStatus.ASSIGNED

    action = (
        "REASSIGNED"
        if old_assigned_to_id is not None
        and old_assigned_to_id != staff_user.id
        else "ASSIGNED"
    )

    create_history(
        session=session,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action=action,
        old_value=(
            str(old_assigned_to_id)
            if old_assigned_to_id is not None
            else None
        ),
        new_value=str(staff_user.id),
    )

    create_notification(
        session=session,
        user_id=complaint.reported_by_id,
        title="Complaint Assigned",
        message=(
            f"Your complaint '{complaint.title}' "
            f"has been assigned to {staff_user.name}."
        ),
    )

    if (
        old_assigned_to_id is not None
        and old_assigned_to_id != staff_user.id
    ):
        create_notification(
            session=session,
            user_id=old_assigned_to_id,
            title="Complaint Reassigned",
            message=(
                f'Complaint "{complaint.title}" '
                f'has been reassigned to {staff_user.name}.'
            ),
        )

    create_notification(
        session=session,
        user_id=staff_user.id,
        title="Complaint Assigned to You",
        message=(
            f'Complaint "{complaint.title}" '
            f'has been assigned to you.'
        ),
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    room = session.get(Room, complaint.room_id)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint room not found",
        )

    return ComplaintRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_reason=complaint.ai_reason,
        room_id=complaint.room_id,
        block=room.block,
        floor=room.floor,
        room_number=room.room_number,
        apartment=room.apartment,
        reported_by_id=complaint.reported_by_id,
        reported_by_name=complaint.reported_by.name,
        reported_by_email=complaint.reported_by.email,
        assigned_to_id=complaint.assigned_to_id,
    )



@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintRead,
)
def update_complaint_status(
    complaint_id: UUID,
    status_data: ComplaintStatusUpdate,
    current_user: User = Depends(
        require_role(
            UserRole.STAFF,
            UserRole.ADMIN,
        )
    ),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    current_status = complaint.status
    new_status = status_data.status

    if new_status == current_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Complaint is already {current_status.value}",
        )
    
    if new_status == ComplaintStatus.ASSIGNED:
        if complaint.assigned_to_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complaint must be assigned before setting status to ASSIGNED",
            )

    allowed_statuses = VALID_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: "
                f"{current_status.value} -> {new_status.value}"
            ),
        )

    old_status = complaint.status

    complaint.status = new_status

    create_history(
        session=session,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="STATUS_CHANGED",
        old_value=old_status.value,
        new_value=new_status.value,
    )
    
    create_notification(
        session=session,
        user_id=complaint.reported_by_id,
        title="Complaint Status Updated",
        message=(
            f"Your complaint '{complaint.title}' "
            f"is now {new_status.value}."
        ),
    )
    
    
    if complaint.assigned_to_id is not None:
        create_notification(
            session=session,
            user_id=complaint.assigned_to_id,
            title="Complaint Status Updated",
            message=(
                f'Complaint "{complaint.title}" '
                f'is now {new_status.value}.'
            ),
        )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    room = session.get(Room, complaint.room_id)

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint room not found",
        )

    return ComplaintRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_reason=complaint.ai_reason,
        room_id=complaint.room_id,
        block=room.block,
        floor=room.floor,
        room_number=room.room_number,
        apartment=room.apartment,
        reported_by_id=complaint.reported_by_id,
        reported_by_name=complaint.reported_by.name,
        reported_by_email=complaint.reported_by.email,
        assigned_to_id=complaint.assigned_to_id,
    )




@router.get(
    "/{complaint_id}/history",
    response_model=list[ComplaintHistoryRead],
)
def get_complaint_history(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # Students can only see their own complaint history.
    # Staff/Admin can see any complaint.
    if (
        current_user.role == UserRole.STUDENT
        and complaint.reported_by_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this complaint",
        )

    statement = (
        select(ComplaintHistory, User)
        .join(User, ComplaintHistory.user_id == User.id)
        .where(
            ComplaintHistory.complaint_id == complaint_id
        )
        .order_by(ComplaintHistory.created_at.asc())
    )

    results = session.exec(statement).all()

    return [
        ComplaintHistoryRead(
            id=history.id,
            complaint_id=history.complaint_id,
            user_id=history.user_id,
            user_name=user.name,
            action=history.action,
            old_value=history.old_value,
            new_value=history.new_value,
            created_at=history.created_at,
        )
        for history, user in results
    ]
    
    
    
@router.post(
    "/{complaint_id}/attachment",
)
async def upload_complaint_attachment(
    complaint_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.reported_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this complaint",
        )

    if complaint.status in (
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved or closed complaints cannot be edited",
        )

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG and WebP images are allowed",
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must not exceed 5 MB",
        )

    extension = Path(file.filename or "").suffix.lower()

    filename = f"{uuid.uuid4()}{extension}"

    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    complaint.attachment_url = f"/uploads/{filename}"
    complaint.attachment_name = file.filename

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    return {
        "attachment_url": complaint.attachment_url,
        "attachment_name": complaint.attachment_name,
    }



@router.get(
    "/{complaint_id}",
    response_model=ComplaintRead,
)
def get_complaint(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.exec(
        select(Complaint)
        .where(Complaint.id == complaint_id)
        .options(
            selectinload(Complaint.room),
            selectinload(Complaint.reported_by),
        )
    ).first()

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Students can only view their own complaints.
    # Staff/Admin can view any complaint.
    if (
        current_user.role == UserRole.STUDENT
        and complaint.reported_by_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this complaint",
        )

    if complaint.room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint room not found",
        )

    if complaint.reported_by is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint reporter not found",
        )

    return ComplaintRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_reason=complaint.ai_reason,

        room_id=complaint.room_id,
        block=complaint.room.block,
        floor=complaint.room.floor,
        room_number=complaint.room.room_number,
        apartment=complaint.room.apartment,

        reported_by_id=complaint.reported_by_id,
        reported_by_name=complaint.reported_by.name,
        reported_by_email=complaint.reported_by.email,

        assigned_to_id=complaint.assigned_to_id,
    )
    
    
    

@router.patch(
    "/{complaint_id}",
    response_model=ComplaintRead,
)
def update_complaint(
    complaint_id: UUID,
    complaint_data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if complaint.reported_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this complaint",
        )

    if complaint.status in (
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CLOSED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved or closed complaints cannot be edited",
        )

    update_data = complaint_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided",
        )

    text_changed = (
        "title" in update_data
        or "description" in update_data
    )

    # Store the original values before making any changes.
    old_values = {
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "priority": complaint.priority,
        "ai_reason": complaint.ai_reason,
    }

    # ---------------------------------------------------------
    # 1. Check duplicates when title/description changes
    # ---------------------------------------------------------
    if text_changed:
        new_title = update_data.get(
            "title",
            complaint.title,
        )

        new_description = update_data.get(
            "description",
            complaint.description,
        )

        duplicate_result = check_for_duplicate_complaint(
            session=session,
            room_id=complaint.room_id,
            title=new_title,
            description=new_description,
            exclude_complaint_id=complaint.id,
        )

        if duplicate_result.is_duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": (
                        "Your edited complaint is similar "
                        "to an existing active complaint."
                    ),
                    "similar_complaint_id": str(
                        duplicate_result.similar_complaint_id
                    ),
                    "confidence": duplicate_result.confidence,
                    "reason": duplicate_result.reason,
                },
            )

    # ---------------------------------------------------------
    # 2. Apply normal editable fields
    # ---------------------------------------------------------
    if "title" in update_data:
        complaint.title = update_data["title"]

    if "description" in update_data:
        complaint.description = update_data["description"]

    # ---------------------------------------------------------
    # 3. Reclassify when text changes
    # ---------------------------------------------------------
    if text_changed:
        try:
            classification = classify_complaint(
                title=complaint.title,
                description=complaint.description,
            )

            complaint.category = classification.category
            complaint.priority = classification.priority
            complaint.ai_reason = classification.reason

        except Exception:
            # Keep the existing classification if AI fails.
            pass

    else:
        # Category/priority can still be explicitly edited
        # when title/description were not changed.
        if "category" in update_data:
            complaint.category = update_data["category"]

        if "priority" in update_data:
            complaint.priority = update_data["priority"]

    # ---------------------------------------------------------
    # 4. Record actual changes exactly once
    # ---------------------------------------------------------
    tracked_fields = [
        "title",
        "description",
        "category",
        "priority",
        "ai_reason",
    ]

    for field in tracked_fields:
        old_value = old_values[field]
        new_value = getattr(complaint, field)

        if old_value == new_value:
            continue

        if hasattr(old_value, "value"):
            old_value = old_value.value
        elif old_value is not None:
            old_value = str(old_value)

        if hasattr(new_value, "value"):
            new_value = new_value.value
        elif new_value is not None:
            new_value = str(new_value)

        create_history(
            session=session,
            complaint_id=complaint.id,
            user_id=current_user.id,
            action=f"UPDATED_{field.upper()}",
            old_value=old_value,
            new_value=new_value,
        )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    # ---------------------------------------------------------
    # 5. Build response
    # ---------------------------------------------------------
    room = session.get(Room, complaint.room_id)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint room not found",
        )

    reported_user = session.get(
        User,
        complaint.reported_by_id,
    )

    if reported_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint reporter not found",
        )

    return ComplaintRead(
        id=complaint.id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        ai_reason=complaint.ai_reason,
        room_id=complaint.room_id,
        block=room.block,
        floor=room.floor,
        room_number=room.room_number,
        apartment=room.apartment,
        reported_by_id=complaint.reported_by_id,
        reported_by_name=reported_user.name,
        reported_by_email=reported_user.email,
        assigned_to_id=complaint.assigned_to_id,
    )