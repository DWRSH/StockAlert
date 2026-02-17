from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
import secrets
import random
from datetime import datetime, timedelta

# Models & Utils
from app.models.user import User, UserRegister, ResetRequest
from app.core.security import get_password_hash, verify_password, create_access_token
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
    
    # print(f"\n🔍 LOGIN DEBUG: Attempting to login with -> '{email_input}'")

    # Try Exact Match
    user = await User.find_one(User.email == email_input)
    
    # Fallback to Case-Insensitive
    if not user:
        # print("⚠️ Exact match failed. Trying case-insensitive search...")
        user = await User.find_one({"email": {"$regex": f"^{email_input}$", "$options": "i"}})

    if not user:
        # print("❌ DB Result: User NOT FOUND")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # print(f"✅ DB Result: User FOUND ({user.email})")

    if not verify_password(form_data.password, user.hashed_password):
        # print("❌ Password Check: FAILED")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_verified:
        # print("❌ Verification Check: FAILED")
        raise HTTPException(status_code=403, detail="Email not verified.")
    
    # print("✅ Login SUCCESS. Generating Token...")

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
# 4. FORGOT PASSWORD (🛡️ ADDED SPAM PROTECTION)
# ==========================================
@router.post("/forgot-password")
async def forgot_password(email: str):
    clean_email = email.strip().lower()
    user = await User.find_one(User.email == clean_email)
    
    if not user:
        # Security: Generic message to prevent email enumeration
        return {"msg": f"OTP sent to {clean_email}"}

    # 🛡️ RATE LIMIT: Check if last request was < 60 seconds ago
    if user.last_otp_request:
        time_since_last = datetime.utcnow() - user.last_otp_request
        if time_since_last.total_seconds() < 60:
            wait_time = 60 - int(time_since_last.total_seconds())
            raise HTTPException(
                status_code=429, 
                detail=f"Please wait {wait_time} seconds before requesting a new OTP."
            )

    # Generate 6 Digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Save to DB & Reset Attempt Counters
    user.reset_otp = otp
    user.reset_otp_expires = datetime.utcnow() + timedelta(minutes=10)
    
    # 🛡️ Update Rate Limiting Fields
    user.last_otp_request = datetime.utcnow() # Abhi ka time note kar lo
    user.otp_attempts = 0                     # Naya OTP hai, attempts 0 kar do
    user.lockout_until = None                 # Agar lock tha to hata do
    
    await user.save()

    # Send Email via Brevo
    email_sent = await send_reset_otp_email(clean_email, otp)
    
    if email_sent:
        return {"msg": f"OTP sent to {clean_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP settings.")

# ==========================================
# 5. RESET PASSWORD (🛡️ ADDED BRUTE FORCE LOCK)
# ==========================================
@router.post("/reset-password")
async def reset_password_confirm(req: ResetRequest):
    clean_email = req.email.strip().lower()
    user = await User.find_one(User.email == clean_email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 🛡️ LOCKOUT CHECK: Kya user blocked hai?
    if user.lockout_until and datetime.utcnow() < user.lockout_until:
        remaining_min = int((user.lockout_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=403, 
            detail=f"Account locked due to too many failed attempts. Try again in {remaining_min} minutes."
        )

    # Basic OTP Existence Check
    if not user.reset_otp:
        raise HTTPException(status_code=400, detail="No OTP request found. Please request again.")

    # 🛡️ OTP VALIDATION WITH COUNTER
    input_otp = str(req.otp).strip()
    db_otp = str(user.reset_otp).strip()
    
    # Agar OTP GALAT hai
    if input_otp != db_otp:
        user.otp_attempts += 1  # Galti count badhao
        
        # Agar 5 baar galti ho gayi -> LOCK KAR DO
        if user.otp_attempts >= 5:
            user.lockout_until = datetime.utcnow() + timedelta(minutes=15) # 15 min block
            await user.save()
            raise HTTPException(
                status_code=403, 
                detail="Too many failed attempts. Account locked for 15 minutes."
            )
        
        await user.save()
        attempts_left = 5 - user.otp_attempts
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid OTP. {attempts_left} attempts remaining."
        )
    
    # Agar OTP SAHI hai, par Expire ho gaya
    if not user.reset_otp_expires or datetime.utcnow() > user.reset_otp_expires:
        raise HTTPException(status_code=400, detail="OTP Expired")

    # ✅ SAB SAHI HAI: Password Change Karo
    user.hashed_password = get_password_hash(req.new_password)
    
    # Cleanup (Sab kuch saaf karo)
    user.reset_otp = None
    user.reset_otp_expires = None
    user.otp_attempts = 0
    user.lockout_until = None
    user.last_otp_request = None # Optional: Clear last request timestamp
    
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
