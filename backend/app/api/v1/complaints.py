from fastapi import APIRouter, Depends, HTTPException, status
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
from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCreate,
    ComplaintRead,
    ComplaintStatusUpdate,
    ComplaintUpdate,
)
from sqlmodel import Session, select
from uuid import UUID

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
    room = session.get(Room, complaint_data.room_id)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
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
        room_id=complaint_data.room_id,
        reported_by_id=current_user.id,
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    
    staff_users = session.exec(
        select(User).where(
            User.role.in_(
                [UserRole.STAFF, UserRole.ADMIN]
            )
        )
    ).all()

    for staff_user in staff_users:
        create_notification(
            session=session,
            user_id=staff_user.id,
            title="New Complaint",
            message=(
                f"A new complaint '{complaint.title}' "
                f"has been submitted."
            ),
        )

    return complaint

@router.get(
    "",
    response_model=list[ComplaintRead],
)
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = (
        select(Complaint)
        .where(
            Complaint.reported_by_id == current_user.id
        )
        .order_by(
            Complaint.created_at.desc()
        )
    )

    return session.exec(statement).all()

@router.get(
    "/all",
    response_model=list[ComplaintRead],
)
def get_all_complaints(
    current_user: User = Depends(
        require_role(
            UserRole.STAFF,
            UserRole.ADMIN,
        )
    ),
    session: Session = Depends(get_session),
):
    statement = (
        select(Complaint)
        .order_by(Complaint.created_at.desc())
    )

    return session.exec(statement).all()


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

    staff_user = session.get(
        User,
        assignment.assigned_to_id,
    )

    if staff_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found",
        )

    if staff_user.role not in (
        UserRole.STAFF,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint can only be assigned to staff or admin",
        )

    complaint.assigned_to_id = staff_user.id
    complaint.status = ComplaintStatus.ASSIGNED
    
    create_notification(
        session=session,
        user_id=complaint.reported_by_id,
        title="Complaint Assigned",
        message=(
            f"Your complaint '{complaint.title}' "
            f"has been assigned to {staff_user.name}."
        ),
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    return complaint




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
        return complaint
    
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

    complaint.status = new_status

    create_notification(
        session=session,
        user_id=complaint.reported_by_id,
        title="Complaint Status Updated",
        message=(
            f"Your complaint '{complaint.title}' "
            f"is now {new_status.value}."
        ),
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    return complaint




@router.get(
    "/{complaint_id}",
    response_model=ComplaintRead,
)
def get_complaint(
    complaint_id: UUID,
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
            detail="You do not have permission to view this complaint",
        )

    return complaint




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

    update_data = complaint_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(complaint, field, value)

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    return complaint

