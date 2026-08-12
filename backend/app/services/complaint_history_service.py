from uuid import UUID

from sqlmodel import Session

from app.models.complaint_history import ComplaintHistory


def create_history(
    session: Session,
    complaint_id: UUID,
    user_id: UUID,
    action: str,
    old_value: str | None = None,
    new_value: str | None = None,
) -> ComplaintHistory:
    history = ComplaintHistory(
        complaint_id=complaint_id,
        user_id=user_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
    )

    session.add(history)
    session.flush()

    return history