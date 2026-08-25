from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.announcement import Announcement
from app.models.room import Room
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementRead
from app.services.notification_service import create_notification
from sqlmodel import Session, or_, select
from app.models.announcement_block import AnnouncementBlock


router = APIRouter(
    prefix="/api/v1/announcements",
    tags=["Announcements"],
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

    announcement = Announcement(
        title=announcement_data.title,
        message=announcement_data.message,
        hostel_id=None,
        created_by_id=current_user.id,
    )

    session.add(announcement)
    session.flush()

    # Normalize and remove duplicate/empty blocks.
    blocks = {
        block.strip()
        for block in announcement_data.blocks
        if block.strip()
    }

    # Save announcement blocks.
    for block in blocks:
        announcement_block = AnnouncementBlock(
            announcement_id=announcement.id,
            block=block,
        )

        session.add(announcement_block)

    # Find students who should receive the notification.
    if not blocks:
        # No blocks selected = global announcement.
        students = session.exec(
            select(User).where(
                User.role == UserRole.STUDENT,
                User.is_active == True,
            )
        ).all()

    else:
        # Block-targeted announcement.
        students = session.exec(
            select(User)
            .join(Room, User.room_id == Room.id)
            .where(
                User.role == UserRole.STUDENT,
                User.is_active == True,
                Room.block.in_(blocks),
            )
        ).all()

    # Create notification for each matching student.
    for student in students:
        create_notification(
            session=session,
            user_id=student.id,
            title="New Announcement",
            message=announcement.title,
        )

    session.commit()
    session.refresh(announcement)

    saved_blocks = session.exec(
        select(AnnouncementBlock).where(
            AnnouncementBlock.announcement_id == announcement.id
        )
    ).all()

    return {
        "id": announcement.id,
        "title": announcement.title,
        "message": announcement.message,
        "hostel_id": announcement.hostel_id,
        "created_by_id": announcement.created_by_id,
        "is_active": announcement.is_active,
        "created_at": announcement.created_at,
        "blocks": [
            block.block
            for block in saved_blocks
        ],
    }



@router.get(
    "",
    response_model=list[AnnouncementRead],
)
def get_announcements(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    offset = (page - 1) * limit

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

    else:
        # Students see global announcements plus
        # announcements targeted to their block.
        if current_user.room_id is None:
            statement = statement.where(
                ~Announcement.blocks.any()
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
                    ~Announcement.blocks.any(),
                    Announcement.blocks.any(
                        AnnouncementBlock.block == room.block
                    ),
                )
            )

        statement = statement.order_by(
            Announcement.created_at.desc()
        )

    # Apply pagination after all filtering.
    statement = (
        statement
        .offset(offset)
        .limit(limit)
    )

    announcements = session.exec(statement).all()

    # Convert AnnouncementBlock objects into block names.
    result = []

    for announcement in announcements:
        result.append(
            AnnouncementRead(
                id=announcement.id,
                title=announcement.title,
                message=announcement.message,
                hostel_id=announcement.hostel_id,
                created_by_id=announcement.created_by_id,
                is_active=announcement.is_active,
                created_at=announcement.created_at,
                blocks=[
                    block.block
                    for block in announcement.blocks
                ],
            )
        )

    return result



@router.patch(
    "/{announcement_id}/deactivate",
    response_model=AnnouncementRead,
)
def deactivate_announcement(
    announcement_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    announcement = session.get(
        Announcement,
        announcement_id,
    )

    if announcement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )

    if not announcement.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Announcement is already inactive",
        )

    announcement.is_active = False

    session.add(announcement)
    session.commit()
    session.refresh(announcement)

    blocks = session.exec(
        select(AnnouncementBlock).where(
            AnnouncementBlock.announcement_id == announcement.id
        )
    ).all()

    return AnnouncementRead(
        id=announcement.id,
        title=announcement.title,
        message=announcement.message,
        hostel_id=announcement.hostel_id,
        created_by_id=announcement.created_by_id,
        is_active=announcement.is_active,
        created_at=announcement.created_at,
        blocks=[block.block for block in blocks],
    )
