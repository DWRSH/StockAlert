# File: app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User, UserRegister
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.email import send_verification_email
from app.core.config import settings
import secrets

router = APIRouter()

# ==========================================
# 1. REGISTER ROUTE (Ye missing tha!)
# ==========================================
@router.post("/register")
async def register(user_data: UserRegister, background_tasks: BackgroundTasks):
    # Check if user already exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate Token & Hash Password
    token = secrets.token_urlsafe(32)
    hashed_pass = get_password_hash(user_data.password)
    
    # Create User in DB
    new_user = User(
        email=user_data.email, 
        hashed_password=hashed_pass,
        is_verified=False,
        verification_token=token
    )
    await new_user.create()
    
    # Send Email in Background
    background_tasks.add_task(send_verification_email, user_data.email, token)
    
    return {"msg": "Registration successful! Please check email to verify."}

# ==========================================
# 2. LOGIN ROUTE (Token Generation)
# ==========================================
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    
    # Verify User & Password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Check if Email is Verified
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified.")
    
    # Generate JWT Token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# 3. VERIFY EMAIL ROUTE (Redirect Logic)
# ==========================================
@router.get("/verify-email")
async def verify_email(token: str):
    user = await User.find_one(User.verification_token == token)
    
    # Agar token galat hai, Frontend pe error bhejo
    if not user:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=invalid_token")
    
    # User Verify karo
    user.is_verified = True
    user.verification_token = None
    await user.save()
    
    # Verification ke baad Frontend pe Login page par bhejo
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?verified=true")
