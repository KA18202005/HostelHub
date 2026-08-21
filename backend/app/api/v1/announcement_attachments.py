from pathlib import Path
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.announcement import Announcement
from app.models.announcement_attachment import (
    AnnouncementAttachment,
)
from app.models.room import Room
from app.models.user import User
from app.schemas.announcement_attachment import (
    AnnouncementAttachmentRead,
)


router = APIRouter(
    prefix="/api/v1/announcement-attachments",
    tags=["Announcement Attachments"],
)


ALLOWED_FILE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

MAX_FILE_SIZE = 5 * 1024 * 1024

UPLOAD_DIR = Path("uploads/announcements")


def can_view_announcement(
    announcement: Announcement,
    current_user: User,
    session: Session,
) -> bool:

    # Admin and staff can view all announcements.
    if current_user.role in {
        UserRole.ADMIN,
        UserRole.STAFF,
    }:
        return True

    # Students can view global announcements.
    if announcement.hostel_id is None:
        return True

    # Student must have a room.
    if current_user.room_id is None:
        return False

    room = session.get(Room, current_user.room_id)

    if room is None:
        return False

    return room.hostel_id == announcement.hostel_id


@router.post(
    "/{announcement_id}",
    response_model=AnnouncementAttachmentRead,
    status_code=201,
)
async def upload_announcement_attachment(
    announcement_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    announcement = session.get(
        Announcement,
        announcement_id,
    )

    if announcement is None:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found",
        )

    # Only admin/staff can upload announcement attachments.
    if current_user.role not in {
        UserRole.ADMIN,
        UserRole.STAFF,
    }:
        raise HTTPException(
            status_code=403,
            detail="Only staff or admin can upload announcement attachments",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )

    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP and PDF files are allowed",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 5 MB",
        )

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_filename = Path(file.filename).name

    stored_filename = (
        f"{announcement_id}_{uuid4().hex}_{safe_filename}"
    )

    file_path = UPLOAD_DIR / stored_filename

    with file_path.open("wb") as buffer:
        buffer.write(contents)

    attachment = AnnouncementAttachment(
        announcement_id=announcement_id,
        uploaded_by_id=current_user.id,
        filename=file.filename,
        stored_filename=stored_filename,
        content_type=file.content_type,
        file_size=file_path.stat().st_size,
    )

    session.add(attachment)
    session.commit()
    session.refresh(attachment)

    return attachment


@router.get(
    "/{announcement_id}",
    response_model=list[AnnouncementAttachmentRead],
)
def get_announcement_attachments(
    announcement_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    announcement = session.get(
        Announcement,
        announcement_id,
    )

    if announcement is None:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found",
        )

    if not can_view_announcement(
        announcement,
        current_user,
        session,
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view these attachments",
        )

    statement = (
        select(AnnouncementAttachment)
        .where(
            AnnouncementAttachment.announcement_id
            == announcement_id
        )
        .order_by(
            AnnouncementAttachment.created_at.asc()
        )
    )

    return session.exec(statement).all()


@router.get("/file/{stored_filename}")
def get_announcement_attachment_file(
    stored_filename: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    attachment = session.exec(
        select(AnnouncementAttachment).where(
            AnnouncementAttachment.stored_filename
            == stored_filename
        )
    ).first()

    if attachment is None:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )

    announcement = session.get(
        Announcement,
        attachment.announcement_id,
    )

    if announcement is None:
        raise HTTPException(
            status_code=404,
            detail="Announcement not found",
        )

    if not can_view_announcement(
        announcement,
        current_user,
        session,
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this attachment",
        )

    file_path = UPLOAD_DIR / attachment.stored_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Attachment file not found on server",
        )

    return FileResponse(
        path=file_path,
        media_type=attachment.content_type,
        filename=attachment.filename,
    )