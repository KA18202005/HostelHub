from sqlmodel import Session, select, func

from app.enums.complaint_status import ComplaintStatus
from app.models.complaint import Complaint


def get_complaint_statistics(session: Session) -> dict:
    total = session.exec(
        select(func.count(Complaint.id))
    ).one()

    open_count = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.OPEN
        )
    ).one()

    assigned = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.assigned_to_id != None
        )
    ).one()

    unassigned = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.assigned_to_id == None
        )
    ).one()

    in_progress = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.IN_PROGRESS
        )
    ).one()

    resolved = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.RESOLVED
        )
    ).one()

    closed = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.status == ComplaintStatus.CLOSED
        )
    ).one()

    return {
        "total": total,
        "open": open_count,
        "assigned": assigned,
        "unassigned": unassigned,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
    }