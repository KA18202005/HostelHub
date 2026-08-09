from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomCreate, RoomRead


router = APIRouter(
    prefix="/api/v1/rooms",
    tags=["Rooms"],
)


@router.post(
    "",
    response_model=RoomRead,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    hostel = session.get(Hostel, room_data.hostel_id)

    if hostel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hostel not found",
        )

    existing_room = session.exec(
        select(Room).where(
            Room.hostel_id == room_data.hostel_id,
            Room.block == room_data.block,
            Room.room_number == room_data.room_number,
        )
    ).first()

    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room already exists in this block",
        )

    room = Room(
        block=room_data.block,
        room_number=room_data.room_number,
        floor=room_data.floor,
        capacity=room_data.capacity,
        hostel_id=room_data.hostel_id,
    )

    session.add(room)
    session.commit()
    session.refresh(room)

    return room