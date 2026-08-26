from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel

from pydantic import BaseModel
from app.enums.roles import UserRole



class AdminRoomUpdate(SQLModel):
    room_id: UUID | None = None

class AdminUserRead(SQLModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    room_id: UUID | None
    created_at: datetime
    
class AdminRoleUpdate(SQLModel):
    role: UserRole
    
    
class AdminUserStatusUpdate(SQLModel):
    is_active: bool
    
    
class PaginatedAdminUserRead(BaseModel):
    items: list[AdminUserRead]
    page: int
    limit: int
    total: int
    pages: int