from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select


from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.complaint import Complaint
from app.models.complaint_attachment import ComplaintAttachment
from app.schemas.attachment import ComplaintAttachmentRead
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/attachments",
    tags=["Attachments"],
)

UPLOAD_DIR = Path("uploads")


@router.get(
    "/{complaint_id}/attachments",
    response_model=list[ComplaintAttachmentRead],
)
def get_complaint_attachments(
    complaint_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    if (
        current_user.role == UserRole.STUDENT
        and complaint.reported_by_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view these attachments",
        )

    statement = (
        select(ComplaintAttachment)
        .where(
            ComplaintAttachment.complaint_id == complaint_id
        )
        .order_by(ComplaintAttachment.created_at.asc())
    )

    return session.exec(statement).all()