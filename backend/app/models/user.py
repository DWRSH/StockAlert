from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# 1. Database Model
class User(Document):
    # Indexed se DB search fast hoti hai aur duplicate email nahi aayenge
    email: Indexed(EmailStr, unique=True) 
    hashed_password: str
    
    # Email Verification Fields
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_sent_at: Optional[datetime] = None

    # Role Field (Admin/User)
    role: str = "user" 

    # ✅ NEW: Status Field (Admin Dashboard ke liye zaroori)
    # Default True rahega, agar False hua toh user login nahi kar payega
    is_active: bool = True

    # Telegram Integration
    telegram_id: Optional[str] = None 
    
    # Audit Trail
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

# 2. Input Validation Model (Auth Routes ke liye)
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
