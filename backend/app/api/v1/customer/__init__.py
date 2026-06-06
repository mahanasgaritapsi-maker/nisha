from fastapi import APIRouter

from app.api.v1.customer.auth import router as auth_router
from app.api.v1.customer.conversations import router as conversations_router

router = APIRouter(prefix="/customer")
router.include_router(auth_router)
router.include_router(conversations_router)

__all__ = ["router"]
