import os
import secrets
from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlmodel import Session, select
from app.core.security import (
    create_access_token,
    create_oauth_exchange_token,
    decode_oauth_exchange_token,
)
from app.core.config import settings
from app.db.database import get_session
from app.enums.roles import UserRole
from app.models.user import User
from app.api.dependencies import get_current_user
from app.models.room import Room
from pydantic import BaseModel


class OAuthExchangeRequest(BaseModel):
    code: str
    
    
oauth_sessions: Dict[str, str] = {}


# OAuth development settings
if settings.OAUTHLIB_INSECURE_TRANSPORT == "1":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

if settings.OAUTHLIB_RELAX_TOKEN_SCOPE == "1":
    os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
]


def create_google_flow() -> Flow:
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        autogenerate_code_verifier=True,
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    return flow


@router.get("/google/login")
async def google_login(request: Request):
    flow = create_google_flow()

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="select_account",
        hd=settings.GOOGLE_ALLOWED_DOMAIN,
    )

    oauth_sessions[state] = flow.code_verifier


    return RedirectResponse(
        authorization_url
    )


@router.get("/google/callback")
async def google_callback(
    request: Request,
    session: Session = Depends(get_session),
):
    state = request.query_params.get("state")

    if not state:
        raise HTTPException(
            status_code=400,
            detail="OAuth state missing",
        )

    code_verifier = oauth_sessions.pop(state, None)

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="OAuth session expired or invalid. Please restart Google login.",
        )

    flow = create_google_flow()

    flow.state = state
    flow.code_verifier = code_verifier

    flow.fetch_token(
        authorization_response=str(request.url)
    )

    credentials = flow.credentials

    # 5. Verify Google ID token
    google_id_info = id_token.verify_oauth2_token(
        credentials.id_token,
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )

    # 6. Extract Google identity
    email = google_id_info.get("email")
    name = google_id_info.get("name")
    google_sub = google_id_info.get("sub")
    hosted_domain = google_id_info.get("hd")

    # 7. Verify college domain
    if hosted_domain != settings.GOOGLE_ALLOWED_DOMAIN:
        raise HTTPException(
            status_code=403,
            detail="Only IIIT Bhubaneswar accounts are allowed",
        )

    # 8. Find existing user
    statement = select(User).where(
        User.google_sub == google_sub
    )

    user = session.exec(statement).first()

    # 9. Create user if they don't exist
    if user is None:
        user = User(
            name=name,
            email=email,
            google_sub=google_sub,
            role=UserRole.STUDENT,
        )

        session.add(user)
        session.commit()
        session.refresh(user)

        message = "User created successfully"

    else:
        message = "User logged in successfully"

    # 10. Temporary response
    access_token = create_access_token(
        user_id=str(user.id),
        role=user.role.value,
    )

    exchange_token = create_oauth_exchange_token(
        access_token
    )

    frontend_url = settings.FRONTEND_URL

    response = RedirectResponse(
        url=f"{frontend_url}/auth/callback?code={exchange_token}"
    )

    return response



@router.post("/exchange")
async def exchange_oauth_code(
    data: OAuthExchangeRequest,
):
    payload = decode_oauth_exchange_token(data.code)

    if payload is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth exchange code",
        )

    access_token = payload.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth exchange code",
        )

    return {
        "access_token": access_token,
    }

    
@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    room = None

    if current_user.room_id is not None:
        room = session.get(Room, current_user.room_id)
        
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "room": (
            {
                "id": str(room.id),
                "block": room.block,
                "floor": room.floor,
                "room_number": room.room_number,
                "apartment": room.apartment,
            }
            if room is not None
            else None
        ),
    }
    
