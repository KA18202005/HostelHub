from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.user import User
from app.schemas.admin import AdminUserRead
from uuid import UUID
from app.models.room import Room
from app.schemas.admin import AdminRoleUpdate
from app.schemas.admin import AdminUserStatusUpdate
from app.schemas.admin import AdminRoomUpdate

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)


@router.get(
    "/users",
    response_model=list[AdminUserRead],
)
def get_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    statement = (
        select(User)
        .order_by(User.created_at.desc())
    )

    return session.exec(statement).all()



@router.get(
    "/staff",
    response_model=list[AdminUserRead],
)
def get_staff_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in (
        UserRole.STAFF,
        UserRole.ADMIN,
    ):
        raise HTTPException(
            status_code=403,
            detail="Staff or admin access required",
        )

    statement = (
        select(User)
        .where(
            User.role.in_(
                [
                    UserRole.STAFF,
                    UserRole.ADMIN,
                ]
            ),
            User.is_active == True,
        )
        .order_by(User.name.asc())
    )

    return session.exec(statement).all()


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserRead,
)
def update_user_role(
    user_id: UUID,
    data: AdminRoleUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
        
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role",
        )

    user.role = data.role

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.patch(
    "/users/{user_id}/room",
    response_model=AdminUserRead,
)
def update_user_room(
    user_id: UUID,
    data: AdminRoomUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=400,
            detail="Only students can be assigned to rooms",
        )

    if data.room_id is not None:
        room = session.get(Room, data.room_id)

        if room is None:
            raise HTTPException(
                status_code=404,
                detail="Room not found",
            )

    user.room_id = data.room_id

    session.add(user)
    session.commit()
    session.refresh(user)

    return user



@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserRead,
)
def update_user_status(
    user_id: UUID,
    data: AdminUserStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    user.is_active = data.is_active

    session.add(user)
    session.commit()
    session.refresh(user)

    return user