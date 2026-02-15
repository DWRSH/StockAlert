from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# 1. Database Model
class User(Document):
    # ... (Your existing fields: email, hashed_password, is_verified, etc.) ...
    email: Indexed(EmailStr, unique=True) 
    hashed_password: str
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_sent_at: Optional[datetime] = None
    role: str = "user" 
    is_active: bool = True
    telegram_id: Optional[str] = None 
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # ✅ ADD THESE TWO NEW FIELDS FOR RESET PASSWORD
    reset_otp: Optional[str] = None
    reset_otp_expires: Optional[datetime] = None

    class Settings:
        name = "users"

# 2. Input Validation Model (No changes needed here for now)
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

# ✅ ADD THIS NEW SCHEMA FOR PASSWORD RESET REQUEST
class ResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
