from sqlmodel import Session, select, func

from app.enums.roles import UserRole
from app.enums.complaint_status import ComplaintStatus
from app.models.complaint import Complaint
from app.models.user import User


MAX_ACTIVE_COMPLAINTS = 10


def get_least_loaded_staff(
    session: Session,
) -> User | None:
    staff_users = session.exec(
        select(User).where(
            User.role == UserRole.STAFF,
            User.is_active == True,
        )
    ).all()

    if not staff_users:
        return None

    workloads = []

    for staff_user in staff_users:
        active_count = session.exec(
            select(func.count(Complaint.id)).where(
                Complaint.assigned_to_id == staff_user.id,
                Complaint.status.in_(
                    [
                        ComplaintStatus.ASSIGNED,
                        ComplaintStatus.IN_PROGRESS,
                    ]
                ),
            )
        ).one()

        if active_count < MAX_ACTIVE_COMPLAINTS:
            workloads.append(
                (staff_user, active_count)
            )

    if not workloads:
        return None

    workloads.sort(
        key=lambda item: item[1]
    )

    return workloads[0][0]