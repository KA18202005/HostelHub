from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.announcement import Announcement
from app.models.room import Room
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementRead
from app.models.hostel import Hostel
from app.models.notification import Notification
from app.services.notification_service import create_notification
from sqlmodel import Session, or_, select


router = APIRouter(
    prefix="/api/v1/announcements",
    tags=["Announcements"],
)


@router.post(
    "",
    response_model=AnnouncementRead,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "",
    response_model=AnnouncementRead,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in {
        UserRole.ADMIN,
        UserRole.STAFF,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or admin access required",
        )

    # If a hostel is specified, verify it exists.
    if announcement_data.hostel_id is not None:
        hostel_exists = session.exec(
            select(Hostel).where(
                Hostel.id == announcement_data.hostel_id
            )
        ).first()

        if hostel_exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hostel not found",
            )

    announcement = Announcement(
        title=announcement_data.title,
        message=announcement_data.message,
        hostel_id=announcement_data.hostel_id,
        created_by_id=current_user.id,
    )

    session.add(announcement)
    session.flush()

    # Find students who should receive the notification.
    if announcement.hostel_id is None:
        students = session.exec(
            select(User).where(
                User.role == UserRole.STUDENT,
                User.is_active == True,
            )
        ).all()

    else:
        students = session.exec(
            select(User)
            .join(Room, User.room_id == Room.id)
            .where(
                User.role == UserRole.STUDENT,
                User.is_active == True,
                Room.hostel_id == announcement.hostel_id,
            )
        ).all()

    for student in students:
        create_notification(
            session=session,
            user_id=student.id,
            title="New Announcement",
            message=announcement.title,
        )

    session.commit()
    session.refresh(announcement)

    return announcement




@router.get(
    "",
    response_model=list[AnnouncementRead],
)
def get_announcements(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Announcement).where(
        Announcement.is_active == True
    )

    # Admin and staff can see all active announcements.
    if current_user.role in {
        UserRole.ADMIN,
        UserRole.STAFF,
    }:
        statement = statement.order_by(
            Announcement.created_at.desc()
        )

        return session.exec(statement).all()

    # Students see global announcements plus
    # announcements targeted to their hostel.
    if current_user.room_id is None:
        statement = statement.where(
            Announcement.hostel_id == None
        )
    else:
        room = session.get(Room, current_user.room_id)

        if room is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student room not found",
            )

        statement = statement.where(
            or_(
                Announcement.hostel_id == None,
                Announcement.hostel_id == room.hostel_id,
            )
        )

    statement = statement.order_by(
        Announcement.created_at.desc()
    )

    return session.exec(statement).all()