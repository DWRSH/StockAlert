import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from app.models.user import User, UserRegister
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.email import send_verification_email
from app.core.config import settings

router = APIRouter()

@router.post("/register")
async def register(user_data: UserRegister, background_tasks: BackgroundTasks):
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    token = secrets.token_urlsafe(32)
    hashed_pass = get_password_hash(user_data.password)
    new_user = User(email=user_data.email, hashed_password=hashed_pass, is_verified=False, verification_token=token)
    await new_user.create()
    
    # Ensure email.py exists in utils
    background_tasks.add_task(send_verification_email, user_data.email, token)
    return {"msg": "Registration successful! Check email."}

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(data={"sub": user.email}), "token_type": "bearer"}