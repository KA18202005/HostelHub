from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationRead],
)
def get_my_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    offset = (page - 1) * limit

    statement = (
        select(Notification)
        .where(
            Notification.user_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return session.exec(statement).all()


@router.get(
    "/unread",
    response_model=list[NotificationRead],
)
def get_unread_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    offset = (page - 1) * limit

    statement = (
        select(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .order_by(
            Notification.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return session.exec(statement).all()




@router.patch(
    "/{notification_id}/read",
    response_model=NotificationRead,
)
def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    notification = session.get(Notification, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this notification",
        )

    notification.is_read = True

    session.add(notification)
    session.commit()
    session.refresh(notification)

    return notification