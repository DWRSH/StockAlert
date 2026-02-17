from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# 1. Database Model
class User(Document):
    email: Indexed(EmailStr, unique=True) 
    hashed_password: str
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_sent_at: Optional[datetime] = None
    role: str = "user" 
    is_active: bool = True
    telegram_id: Optional[str] = None 
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Forgot Password Fields
    reset_otp: Optional[str] = None
    reset_otp_expires: Optional[datetime] = None

    # 🛡️ RATE LIMITING FIELDS (Ye 3 lines add karein)
    otp_attempts: int = 0                  # Kitni baar galat OTP dala?
    lockout_until: Optional[datetime] = None # Kab tak account blocked hai?
    last_otp_request: Optional[datetime] = None # Pichla OTP kab bheja tha?

    class Settings:
        name = "users"

# 2. Input Validation Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class ResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
