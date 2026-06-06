from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.user_mapper import user_to_response
from app.services.auth_service import AuthError, authenticate_user, register_seller

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    token = create_access_token(user_id=user.id, role=user.role.value)
    return TokenResponse(
        access_token=token,
        user=user_to_response(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user = register_seller(
            db,
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        user = authenticate_user(
            db,
            email=str(payload.email),
            password=payload.password,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return user_to_response(current_user)
