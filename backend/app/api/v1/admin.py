from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.user import User
from app.schemas.admin import AdminUserRead, PaginatedAdminUserRead
from uuid import UUID
from app.models.room import Room
from app.schemas.admin import AdminRoleUpdate
from app.schemas.admin import AdminUserStatusUpdate
from app.schemas.admin import AdminRoomUpdate
from app.services.notification_service import create_notification


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"],
)


@router.get(
    "/users",
    response_model=PaginatedAdminUserRead,
)
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    offset = (page - 1) * limit

    total = session.exec(
        select(func.count(User.id))
    ).one()

    statement = (
        select(User)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    users = session.exec(statement).all()

    pages = (total + limit - 1) // limit

    return PaginatedAdminUserRead(
        items=users,
        page=page,
        limit=limit,
        total=total,
        pages=pages,
    )


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
            User.is_active.is_(True),
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

    old_room_id = user.room_id

    # Same room: nothing changed, so don't create a notification.
    if old_room_id == data.room_id:
        return user

    # Unassign student from their current room.
    if data.room_id is None:
        user.room_id = None

        session.add(user)

        create_notification(
            session=session,
            user_id=user.id,
            title="Room Assignment Updated",
            message="Your room assignment has been removed.",
        )

        session.commit()
        session.refresh(user)

        return user

    # Get the new room.
    room = session.get(Room, data.room_id)

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    # Check room capacity.
    current_student_count = session.exec(
        select(User).where(
            User.room_id == room.id,
            User.role == UserRole.STUDENT,
            User.is_active == True,
        )
    ).all()

    if len(current_student_count) >= room.capacity:
        raise HTTPException(
            status_code=409,
            detail="Room is already at full capacity",
        )

    # Assign new room.
    user.room_id = room.id

    session.add(user)

    # Notify student about the new room.
    room_name = f"{room.block} - {room.room_number}"

    if room.apartment:
        room_name += f" ({room.apartment})"

    create_notification(
        session=session,
        user_id=user.id,
        title="Room Assignment Updated",
        message=f"Your room has been changed to {room_name}.",
    )

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

    # An admin cannot deactivate their own account.
    if user.id == current_user.id and not data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    # Prevent the last active admin from being deactivated.
    if (
        user.role == UserRole.ADMIN
        and user.is_active
        and not data.is_active
    ):
        active_admin_count = session.exec(
            select(User).where(
                User.role == UserRole.ADMIN,
                User.is_active == True,
            )
        ).all()

        if len(active_admin_count) <= 1:
            raise HTTPException(
                status_code=400,
                detail="You cannot deactivate the last active admin",
            )

    user.is_active = data.is_active

    session.add(user)
    session.commit()
    session.refresh(user)

    return user