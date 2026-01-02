# File: app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
import secrets

# Models & Utils
from app.models.user import User, UserRegister
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.email import send_verification_email
from app.core.config import settings

router = APIRouter()

# ==========================================
# 🔐 SECURITY HELPERS
# ==========================================
# Note: tokenUrl must match the route name where login happens. 
# Since we are inside 'auth' router with prefix, the relative URL is "token"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token") 

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token Decode
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # User Find (Using Beanie Syntax)
    user = await User.find_one(User.email == email)
    if user is None:
        raise credentials_exception
    return user

# ==========================================
# 1. REGISTER ROUTE
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
        verification_token=token,
        role="user" # Default role
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
# 3. VERIFY EMAIL ROUTE
# ==========================================
@router.get("/verify-email")
async def verify_email(token: str):
    user = await User.find_one(User.verification_token == token)
    
    # Agar token galat hai
    if not user:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=invalid_token")
    
    # User Verify karo
    user.is_verified = True
    user.verification_token = None
    await user.save()
    
    # Redirect to Frontend
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?verified=true")

# ==========================================
# 4. GET USER PROFILE (✅ FIXED)
# ==========================================
@router.get("/getuser") 
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Route: /api/auth/getuser
    Returns: User details including telegram_id
    """
    return {
        "email": current_user.email,
        "name": current_user.email.split("@")[0], 
        "role": getattr(current_user, "role", "user"),
        # ✅ Telegram ID bhi bhejna zaroori hai frontend ke liye
        "telegram_id": getattr(current_user, "telegram_id", "") 
    }
