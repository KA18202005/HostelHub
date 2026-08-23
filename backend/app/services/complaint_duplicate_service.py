from uuid import UUID

from sqlmodel import Session, select

from app.enums.complaint_status import ComplaintStatus
from app.models.complaint import Complaint
from app.services.duplicate_detection_service import detect_duplicate


ACTIVE_STATUSES = {
    ComplaintStatus.OPEN,
    ComplaintStatus.ASSIGNED,
    ComplaintStatus.IN_PROGRESS,
}


def get_active_complaints_for_room(
    session: Session,
    room_id: UUID,
    exclude_complaint_id: UUID | None = None,
) -> list[Complaint]:
    statement = (
        select(Complaint)
        .where(
            Complaint.room_id == room_id,
            Complaint.status.in_(ACTIVE_STATUSES),
        )
        .order_by(Complaint.created_at.desc())
    )

    if exclude_complaint_id is not None:
        statement = statement.where(
            Complaint.id != exclude_complaint_id
        )

    return list(session.exec(statement).all())



def check_for_duplicate_complaint(
    session: Session,
    room_id: UUID,
    title: str,
    description: str,
    exclude_complaint_id: UUID | None = None,
):
    complaints = get_active_complaints_for_room(
        session=session,
        room_id=room_id,
        exclude_complaint_id=exclude_complaint_id,
    )

    existing_complaints = [
        {
            "id": str(complaint.id),
            "title": complaint.title,
            "description": complaint.description,
        }
        for complaint in complaints
    ]

    return detect_duplicate(
        title=title,
        description=description,
        existing_complaints=existing_complaints,
    )