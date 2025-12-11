from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# 1. Database Model
class User(Document):
    # Indexed se DB search fast hoti hai aur duplicate email nahi aayenge
    email: Indexed(EmailStr, unique=True) 
    hashed_password: str
    is_verified: bool = False
    verification_token: Optional[str] = None
    
    # Token Expiry Check karne ke liye field
    verification_sent_at: Optional[datetime] = None

    class Settings:
        name = "users"

# 2. Input Validation Model (Ye auth.py ke liye zaroori hai)
class UserRegister(BaseModel):
    email: EmailStr
    password: str