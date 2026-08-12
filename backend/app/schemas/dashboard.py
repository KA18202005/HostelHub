from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel

from app.enums.complaint_priority import ComplaintPriority
from app.enums.complaint_status import ComplaintStatus


class DashboardComplaint(SQLModel):
    id: UUID
    title: str
    priority: ComplaintPriority
    status: ComplaintStatus
    created_at: datetime


class StudentDashboard(SQLModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    unread_notifications: int
    recent_complaints: list[DashboardComplaint]
    
    
class StaffDashboard(SQLModel):
    total_complaints: int
    unassigned_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    closed_complaints: int
    recent_complaints: list[DashboardComplaint]
    

class AdminDashboard(SQLModel):
    total_users: int
    total_hostels: int
    total_rooms: int

    total_complaints: int
    open_complaints: int
    unassigned_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    closed_complaints: int