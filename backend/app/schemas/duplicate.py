from uuid import UUID

from sqlmodel import SQLModel


class DuplicateDetectionResult(SQLModel):
    is_duplicate: bool
    similar_complaint_id: UUID | None = None
    confidence: float
    reason: str
    
    
class DuplicateComplaintResponse(SQLModel):
    is_duplicate: bool
    similar_complaint_id: UUID | None = None
    confidence: float
    reason: str