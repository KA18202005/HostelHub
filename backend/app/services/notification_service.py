from uuid import UUID

from sqlmodel import Session

from app.models.notification import Notification


def create_notification(
    session: Session,
    user_id: UUID,
    title: str,
    message: str,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
    )

    session.add(notification)
    session.flush()

    return notification