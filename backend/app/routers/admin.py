from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from beanie import PydanticObjectId
from pydantic import BaseModel 

# ✅ User, Alert Models & Email Utils Import
from app.models.user import User
from app.models.alert import Alert 
from app.core.config import settings
from app.utils.email import send_generic_email 

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==========================================
# 🔒 SECURITY: Admin Access Check
# ==========================================
async def get_admin_user(token: str = Depends(oauth2_scheme)):
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
        
    if getattr(user, "role", "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You are not an Admin"
        )
        
    return user

# ==========================================
# 📊 API 1: Dashboard Stats
# ==========================================
@router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_admin_user)):
    total_users = await User.count()
    total_alerts = await Alert.count()
    active_alerts = await Alert.find(Alert.status == "active").count()
    triggered_alerts = await Alert.find(Alert.status == "triggered").count()
    
    return {
        "total_users": total_users,
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "triggered_alerts": triggered_alerts
    }

# ==========================================
# 👥 API 2: Get All Users List
# ==========================================
@router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_admin_user)):
    users = await User.find_all().to_list()
    
    cleaned_users = []
    for u in users:
        u_dict = u.dict()
        u_dict.pop("hashed_password", None) 
        u_dict["_id"] = str(u.id) 
        cleaned_users.append(u_dict)
        
    return cleaned_users

# ==========================================
# 🗑️ API 3: Delete User
# ==========================================
@router.delete("/admin/user/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_admin_user)):
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    try:
        user_to_delete = await User.get(PydanticObjectId(user_id))
        
        if user_to_delete:
            # Delete user's alerts using email
            await Alert.find(Alert.email == user_to_delete.email).delete()
            
            # Delete User
            await user_to_delete.delete()
            return {"message": "User and their alerts deleted successfully"}
        
        raise HTTPException(status_code=404, detail="User not found")
        
    except Exception as e:
        print(f"Delete Error: {e}") 
        raise HTTPException(status_code=400, detail="Delete Failed")

# ==========================================
# 🚫 API 4: Toggle User Status (BAN/UNBAN) - ✅ NEW
# ==========================================
@router.patch("/admin/user/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, admin: User = Depends(get_admin_user)):
    # 1. Self-Ban Prevention
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="You cannot ban yourself")

    try:
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 2. Toggle Status (True -> False, False -> True)
        # getattr use kiya taaki purane users jinke paas field nahi hai wo crash na karein (default True)
        current_status = getattr(user, "is_active", True)
        user.is_active = not current_status
        
        await user.save()
        
        status_msg = "Activated" if user.is_active else "Suspended"
        return {"message": f"User {status_msg} successfully", "is_active": user.is_active}
        
    except Exception as e:
        print(f"Toggle Error: {e}")
        raise HTTPException(status_code=400, detail="Action Failed")

# ==========================================
# 📢 API 5: Broadcast Notification
# ==========================================

class BroadcastRequest(BaseModel):
    subject: str
    message: str

@router.post("/admin/broadcast")
async def send_broadcast(
    data: BroadcastRequest, 
    background_tasks: BackgroundTasks, 
    admin: User = Depends(get_admin_user)
):
    """
    Background Task ka use karke saare users ko email bhejta hai.
    """
    users = await User.find_all().to_list()
    
    count = 0
    for user in users:
        background_tasks.add_task(send_generic_email, user.email, data.subject, data.message)
        count += 1
        
    return {"message": f"Broadcast queued for {count} users! 🚀"}
