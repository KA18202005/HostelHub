from fastapi import APIRouter, Depends
from fastapi import HTTPException
from sqlmodel import Session, func, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.complaint import Complaint
from app.models.notification import Notification
from app.models.user import User
from app.schemas.dashboard import DashboardComplaint, StudentDashboard, StaffDashboard
from app.enums.complaint_status import ComplaintStatus
from app.enums.roles import UserRole
from app.models.hostel import Hostel
from app.models.room import Room
from app.services.dashboard_service import get_complaint_statistics
from app.schemas.dashboard import AdminDashboard


router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/student",
    response_model=StudentDashboard,
)
def get_student_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    total_complaints = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.reported_by_id == current_user.id
        )
    ).one()

    open_complaints = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.reported_by_id == current_user.id,
            Complaint.status == ComplaintStatus.OPEN,
        )
    ).one()

    in_progress_complaints = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.reported_by_id == current_user.id,
            Complaint.status == ComplaintStatus.IN_PROGRESS,
        )
    ).one()

    resolved_complaints = session.exec(
        select(func.count(Complaint.id)).where(
            Complaint.reported_by_id == current_user.id,
            Complaint.status == ComplaintStatus.RESOLVED,
        )
    ).one()

    unread_notifications = session.exec(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    ).one()

    recent_complaints = session.exec(
        select(Complaint)
        .where(
            Complaint.reported_by_id == current_user.id
        )
        .order_by(
            Complaint.created_at.desc()
        )
        .limit(5)
    ).all()

    return StudentDashboard(
        total_complaints=total_complaints,
        open_complaints=open_complaints,
        in_progress_complaints=in_progress_complaints,
        resolved_complaints=resolved_complaints,
        unread_notifications=unread_notifications,
        recent_complaints=[
            DashboardComplaint(
                id=complaint.id,
                title=complaint.title,
                priority=complaint.priority,
                status=complaint.status,
                created_at=complaint.created_at,
            )
            for complaint in recent_complaints
        ],
    )
    


@router.get(
    "/staff",
    response_model=StaffDashboard,
)
def get_staff_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {
        UserRole.STAFF,
        UserRole.ADMIN,
    }:
        raise HTTPException(
            status_code=403,
            detail="Staff or admin access required",
        )

    stats = get_complaint_statistics(session)

    recent_complaints = session.exec(
        select(Complaint)
        .order_by(Complaint.created_at.desc())
        .limit(10)
    ).all()

    return StaffDashboard(
        total_complaints=stats["total"],
        unassigned_complaints=stats["unassigned"],
        assigned_complaints=stats["assigned"],
        in_progress_complaints=stats["in_progress"],
        resolved_complaints=stats["resolved"],
        closed_complaints=stats["closed"],
        recent_complaints=[
            DashboardComplaint(
                id=complaint.id,
                title=complaint.title,
                priority=complaint.priority,
                status=complaint.status,
                created_at=complaint.created_at,
            )
            for complaint in recent_complaints
        ],
    )


@router.get(
    "/admin",
    response_model=AdminDashboard,
)
def get_admin_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    stats = get_complaint_statistics(session)

    total_users = session.exec(
        select(func.count(User.id))
    ).one()

    total_hostels = session.exec(
        select(func.count(Hostel.id))
    ).one()

    total_rooms = session.exec(
        select(func.count(Room.id))
    ).one()

    recent_complaints = session.exec(
        select(Complaint)
        .order_by(Complaint.created_at.desc())
        .limit(10)
    ).all()

    return AdminDashboard(
        total_complaints=stats["total"],
        unassigned_complaints=stats["unassigned"],
        assigned_complaints=stats["assigned"],
        in_progress_complaints=stats["in_progress"],
        resolved_complaints=stats["resolved"],
        closed_complaints=stats["closed"],
        total_users=total_users,
        total_hostels=total_hostels,
        total_rooms=total_rooms,
        recent_complaints=[
            DashboardComplaint(
                id=complaint.id,
                title=complaint.title,
                priority=complaint.priority,
                status=complaint.status,
                created_at=complaint.created_at,
            )
            for complaint in recent_complaints
        ],
    )