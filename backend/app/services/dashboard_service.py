from sqlmodel import Session, select, func, case

from app.enums.complaint_status import ComplaintStatus
from app.models.complaint import Complaint


def get_complaint_statistics(session: Session) -> dict:
    statement = select(
        func.count(Complaint.id).label("total"),

        func.sum(
            case(
                (Complaint.status == ComplaintStatus.OPEN, 1),
                else_=0,
            )
        ).label("open"),

        func.sum(
            case(
                (Complaint.assigned_to_id.is_not(None), 1),
                else_=0,
            )
        ).label("assigned"),

        func.sum(
            case(
                (Complaint.assigned_to_id.is_(None), 1),
                else_=0,
            )
        ).label("unassigned"),

        func.sum(
            case(
                (
                    Complaint.status
                    == ComplaintStatus.IN_PROGRESS,
                    1,
                ),
                else_=0,
            )
        ).label("in_progress"),

        func.sum(
            case(
                (
                    Complaint.status
                    == ComplaintStatus.RESOLVED,
                    1,
                ),
                else_=0,
            )
        ).label("resolved"),

        func.sum(
            case(
                (
                    Complaint.status
                    == ComplaintStatus.CLOSED,
                    1,
                ),
                else_=0,
            )
        ).label("closed"),
    )

    result = session.exec(statement).one()

    return {
        "total": result.total or 0,
        "open": result.open or 0,
        "assigned": result.assigned or 0,
        "unassigned": result.unassigned or 0,
        "in_progress": result.in_progress or 0,
        "resolved": result.resolved or 0,
        "closed": result.closed or 0,
    }