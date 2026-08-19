from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.hostel import Hostel
from app.models.user import User
from app.schemas.hostel import HostelCreate, HostelRead
from app.enums.roles import UserRole
from app.api.dependencies import require_role


router = APIRouter(
    prefix="/api/v1/hostels",
    tags=["Hostels"],
)


@router.post(
    "",
    response_model=HostelRead,
    status_code=status.HTTP_201_CREATED,
)
def create_hostel(
    hostel_data: HostelCreate,
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    session: Session = Depends(get_session),
):
    hostel = Hostel(
        name=hostel_data.name,
        gender=hostel_data.gender,
    )

    session.add(hostel)
    session.commit()
    session.refresh(hostel)

    return hostel


@router.get(
    "",
    response_model=list[HostelRead],
)
def get_hostels(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Hostel)
    ).all()