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
    # ✅ FIX: Register karte waqt hi email ko lowercase kar dein
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
        email=clean_email, # Save clean email
        hashed_password=hashed_pass,
        is_verified=False,
        verification_token=token,
        role="user"
    )
    await new_user.create()
    
    background_tasks.add_task(send_verification_email, clean_email, token)
    
    return {"msg": "Registration successful! Please check email to verify."}

# ==========================================
# 2. LOGIN ROUTE (Fixed & Debugged)
# ==========================================
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Clean Input
    email_input = form_data.username.strip().lower()
    
    print(f"\n🔍 LOGIN DEBUG: Attempting to login with -> '{email_input}'")

    # 2. Try Exact Match First (Fastest)
    user = await User.find_one(User.email == email_input)
    
    # 3. Agar nahi mila, to Case-Insensitive Search karo (Safety Net)
    if not user:
        print("⚠️ Exact match failed. Trying case-insensitive search...")
        user = await User.find_one({"email": {"$regex": f"^{email_input}$", "$options": "i"}})

    # 4. Check User
    if not user:
        print("❌ DB Result: User NOT FOUND")
        # Security reason se hum generic message dete hain, par console me pata chal jayega
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    print(f"✅ DB Result: User FOUND ({user.email})")

    # 5. Verify Password
    if not verify_password(form_data.password, user.hashed_password):
        print("❌ Password Check: FAILED")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # 6. Check Verification
    if not user.is_verified:
        print("❌ Verification Check: FAILED (Email not verified)")
        raise HTTPException(status_code=403, detail="Email not verified.")
    
    print("✅ Password & Verification: SUCCESS. Generating Token...")

    # Generate Token
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
# 4. GET USER PROFILE
# ==========================================
@router.get("/getuser") 
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.email.split("@")[0], 
        "role": getattr(current_user, "role", "user"),
        "telegram_id": getattr(current_user, "telegram_id", "") 
    }
