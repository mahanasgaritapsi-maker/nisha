from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


<<<<<<< HEAD
def _create_token(*, user_id: int, role: str, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.now(UTC) + expires_delta
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": token_type,
=======
def create_access_token(*, user_id: int, role: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


<<<<<<< HEAD
def create_access_token(*, user_id: int, role: str) -> str:
    return _create_token(
        user_id=user_id,
        role=role,
        token_type="access",
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(*, user_id: int, role: str) -> str:
    return _create_token(
        user_id=user_id,
        role=role,
        token_type="refresh",
        expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )


def _decode_token(token: str) -> dict:
=======
def decode_access_token(token: str) -> dict:
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
<<<<<<< HEAD


def decode_access_token(token: str) -> dict:
    payload = _decode_token(token)
    # Tokens issued before the "type" claim existed are treated as access tokens.
    if payload.get("type") == "refresh":
        raise ValueError("Refresh token cannot be used as an access token")
    return payload


def decode_refresh_token(token: str) -> dict:
    payload = _decode_token(token)
    if payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")
    return payload
=======
>>>>>>> 11bf578476c05d667376c7b9fff2f0778bebdd66
