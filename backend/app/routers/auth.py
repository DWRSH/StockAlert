# File: app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse  # 👈 Ye Import Zaroori hai
from app.models.user import User, UserRegister
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.email import send_verification_email
from app.core.config import settings # 👈 Settings import karein
import secrets

router = APIRouter()

# ... (Register aur Login code same rahega) ...

@router.get("/verify-email")
async def verify_email(token: str):
    user = await User.find_one(User.verification_token == token)
    
    # Agar token galat hai, tab bhi frontend pe bhejo par error ke saath
    if not user:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=invalid_token")
    
    # User verify karo
    user.is_verified = True
    user.verification_token = None
    await user.save()
    
    # ✅ REDIRECT: Verification ke baad wapis Frontend bhej do
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?verified=true")
