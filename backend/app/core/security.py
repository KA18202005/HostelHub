from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings


def create_access_token(
    user_id: str,
    role: str,
) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "role": role,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        return None


def create_oauth_exchange_token(
    access_token: str,
) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=2
    )

    payload = {
        "type": "oauth_exchange",
        "access_token": access_token,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.AUTH_SESSION_SECRET,
        algorithm="HS256",
    )


def decode_oauth_exchange_token(
    token: str,
) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SESSION_SECRET,
            algorithms=["HS256"],
        )

        if payload.get("type") != "oauth_exchange":
            return None

        return payload

    except JWTError:
        return None