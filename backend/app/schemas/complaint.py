from uuid import UUID

from sqlmodel import SQLModel

from app.enums.complaint_category import ComplaintCategory
from app.enums.complaint_priority import ComplaintPriority
from app.enums.complaint_status import ComplaintStatus


class ComplaintCreate(SQLModel):
    title: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority = ComplaintPriority.MEDIUM
    room_id: UUID

class ComplaintUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    category: ComplaintCategory | None = None
    priority: ComplaintPriority | None = None
    
class ComplaintAssign(SQLModel):
    assigned_to_id: UUID
    
class ComplaintStatusUpdate(SQLModel):
    status: ComplaintStatus

class ComplaintRead(SQLModel):
    id: UUID
    title: str
    description: str
    category: ComplaintCategory
    priority: ComplaintPriority
    status: ComplaintStatus
    room_id: UUID
    reported_by_id: UUID
    assigned_to_id: UUID | None