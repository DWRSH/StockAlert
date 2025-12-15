from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# 1. Database Model
class User(Document):
    # Indexed se DB search fast hoti hai aur duplicate email nahi aayenge
    email: Indexed(EmailStr, unique=True) 
    hashed_password: str
    name: Optional[str] = None
    
    # Verification Fields
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_sent_at: Optional[datetime] = None

    # Role Field (Admin/User)
    role: str = "user" 

    # 👇 NEW FIELD: User Ban/Suspend System ke liye
    # True = Active, False = Banned
    is_active: bool = True 

    # Creation Time (Optional but good for sorting)
    created_at: datetime = datetime.now()

    class Settings:
        name = "users"

# 2. Input Validation Model (Ye auth.py ke liye zaroori hai)
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
