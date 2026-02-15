from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
import secrets
import random
from datetime import datetime, timedelta

# Models & Utils
# ✅ Added ResetRequest here
from app.models.user import User, UserRegister, ResetRequest
from app.core.security import get_password_hash, verify_password, create_access_token
# ✅ Added send_reset_otp_email here
from app.utils.email import send_verification_email, send_reset_otp_email
from app.core.config import settings

router = APIRouter()

# ==========================================
# 🔐 SECURITY HELPERS
# ==========================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token") 

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await User.find_one(User.email == email)
    if user is None:
        raise credentials_exception
    return user

# ==========================================
# 1. REGISTER ROUTE
# ==========================================
@router.post("/register")
async def register(user_data: UserRegister, background_tasks: BackgroundTasks):
    clean_email = user_data.email.strip().lower()

    # Check if user already exists
    existing_user = await User.find_one(User.email == clean_email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate Token & Hash Password
    token = secrets.token_urlsafe(32)
    hashed_pass = get_password_hash(user_data.password)
    
    # Create User in DB
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pass,
        is_verified=False,
        verification_token=token,
        role="user"
    )
    await new_user.create()
    
    background_tasks.add_task(send_verification_email, clean_email, token)
    
    return {"msg": "Registration successful! Please check email to verify."}

# ==========================================
# 2. LOGIN ROUTE
# ==========================================
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email_input = form_data.username.strip().lower()
    
    print(f"\n🔍 LOGIN DEBUG: Attempting to login with -> '{email_input}'")

    # Try Exact Match
    user = await User.find_one(User.email == email_input)
    
    # Fallback to Case-Insensitive
    if not user:
        print("⚠️ Exact match failed. Trying case-insensitive search...")
        user = await User.find_one({"email": {"$regex": f"^{email_input}$", "$options": "i"}})

    if not user:
        print("❌ DB Result: User NOT FOUND")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    print(f"✅ DB Result: User FOUND ({user.email})")

    if not verify_password(form_data.password, user.hashed_password):
        print("❌ Password Check: FAILED")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_verified:
        print("❌ Verification Check: FAILED")
        raise HTTPException(status_code=403, detail="Email not verified.")
    
    print("✅ Login SUCCESS. Generating Token...")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ==========================================
# 3. VERIFY EMAIL ROUTE
# ==========================================
@router.get("/verify-email")
async def verify_email(token: str):
    user = await User.find_one(User.verification_token == token)
    
    if not user:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=invalid_token")
    
    user.is_verified = True
    user.verification_token = None
    await user.save()
    
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?verified=true")

# ==========================================
# 4. FORGOT PASSWORD (Generate OTP)
# ==========================================
@router.post("/forgot-password")
async def forgot_password(email: str):
    clean_email = email.strip().lower()
    user = await User.find_one(User.email == clean_email)
    
    if not user:
        # Security: Return 404 for now so you can debug
        raise HTTPException(status_code=404, detail="User not found")

    # Generate 6 Digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Save to DB
    user.reset_otp = otp
    user.reset_otp_expires = datetime.utcnow() + timedelta(minutes=10)
    await user.save()

    # Send Email via Brevo (using email.py logic)
    email_sent = await send_reset_otp_email(clean_email, otp)
    
    if email_sent:
        return {"msg": f"OTP sent to {clean_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP settings.")

# ==========================================
# 5. RESET PASSWORD (Verify OTP & Change)
# ==========================================
@router.post("/reset-password")
async def reset_password_confirm(req: ResetRequest):
    clean_email = req.email.strip().lower()
    user = await User.find_one(User.email == clean_email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate OTP
    if not user.reset_otp or user.reset_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Validate Expiry
    if not user.reset_otp_expires or datetime.utcnow() > user.reset_otp_expires:
        raise HTTPException(status_code=400, detail="OTP Expired")

    # Update Password
    user.hashed_password = get_password_hash(req.new_password)
    
    # Clear OTP fields
    user.reset_otp = None
    user.reset_otp_expires = None
    await user.save()
    
    return {"msg": "Password reset successful! You can login now."}

# ==========================================
# 6. GET USER PROFILE
# ==========================================
@router.get("/getuser") 
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.email.split("@")[0], 
        "role": getattr(current_user, "role", "user"),
        "telegram_id": getattr(current_user, "telegram_id", "") 
    }
