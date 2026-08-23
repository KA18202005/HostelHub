from pathlib import Path
from uuid import UUID, uuid4
from app.schemas import attachment
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from app.core.config import settings
import shutil
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.complaint import Complaint
from app.models.complaint_attachment import ComplaintAttachment
from app.schemas.attachment import ComplaintAttachmentRead
from app.models.user import User
from PIL import Image, UnidentifiedImageError
from io import BytesIO


router = APIRouter(
    prefix="/api/v1/attachments",
    tags=["Attachments"],
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024

EXPECTED_FORMATS = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}

UPLOAD_DIR = Path(settings.UPLOAD_DIR)



@router.post(
    "/{complaint_id}/attachments",
    response_model=ComplaintAttachmentRead,
    status_code=201,
)
async def upload_complaint_attachment(
    complaint_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    complaint = session.get(Complaint, complaint_id)

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # Only the student who created the complaint
    # can upload attachments.
    if (
        current_user.role == UserRole.STUDENT
        and complaint.reported_by_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to upload attachments",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )
    
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )


    contents = await file.read()
    

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 5 MB",
    )
        
    try:
        image = Image.open(BytesIO(contents))
        image.verify()

        actual_format = image.format

        if actual_format != EXPECTED_FORMATS[file.content_type]:
            raise HTTPException(
                status_code=400,
                detail="File content does not match its declared image type",
            )

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )
    # Create uploads directory if it doesn't exist.
    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # Generate a unique stored filename.
    extension = Path(file.filename).suffix.lower()

    stored_filename = f"{uuid4().hex}{extension}"

    file_path = UPLOAD_DIR / stored_filename

    with file_path.open("xb") as buffer:
        buffer.write(contents)

    file_size = file_path.stat().st_size

    try:
        attachment = ComplaintAttachment(
            complaint_id=complaint_id,
            uploaded_by_id=current_user.id,
            filename=file.filename,
            stored_filename=stored_filename,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
        )

        session.add(attachment)
        session.commit()
        session.refresh(attachment)

    except Exception:
        session.rollback()

        if file_path.exists():
            file_path.unlink()

        raise

    return attachment


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





@router.get("/file/{stored_filename}")
def get_attachment_file(
    stored_filename: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    attachment = session.exec(
        select(ComplaintAttachment)
        .where(
            ComplaintAttachment.stored_filename == stored_filename
        )
    ).first()

    if attachment is None:
        raise HTTPException(
            status_code=404,
            detail="Attachment not found",
        )

    complaint = session.get(
        Complaint,
        attachment.complaint_id,
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found",
        )

    # Students can only access attachments
    # belonging to their own complaints.
    if (
        current_user.role == UserRole.STUDENT
        and complaint.reported_by_id != current_user.id
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