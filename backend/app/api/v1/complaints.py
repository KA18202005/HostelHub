from backend.app.enums.complaint_status import ComplaintStatus
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.complaint import Complaint
from app.models.room import Room
from app.models.user import User
from app.auth.roles import require_role
from app.enums.roles import UserRole
from app.enums.complaint_status import ComplaintStatus
from app.schemas.complaint import (
    ComplaintAssign,
    ComplaintCreate,
    ComplaintRead,
    ComplaintStatusUpdate,
    ComplaintUpdate,
)
from sqlmodel import Session, select
from uuid import UUID


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

    complaint = Complaint(
        title=complaint_data.title,
        description=complaint_data.description,
        category=complaint_data.category,
        priority=complaint_data.priority,
        room_id=complaint_data.room_id,
        reported_by_id=current_user.id,
    )

    session.add(complaint)
    session.commit()
    session.refresh(complaint)

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

    complaint.status = status_data.status

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

