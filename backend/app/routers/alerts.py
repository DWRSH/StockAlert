from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.user import User
from app.models.alert import Alert
from app.routers.auth import get_current_user 

router = APIRouter()

# ==========================================
# 1. Get All Alerts
# ==========================================
@router.get("/alerts", response_model=List[Alert])
async def get_my_alerts(current_user: User = Depends(get_current_user)):
    # Sort by created_at (Newest first)
    return await Alert.find(Alert.email == current_user.email).sort("-created_at").to_list()

# ==========================================
# 2. Add New Alert (✅ IMPORTANT UPDATE)
# ==========================================
@router.post("/add-alert")
async def add_alert(symbol: str, target: float, current_user: User = Depends(get_current_user)):
    clean_sym = symbol.upper().strip()
    
    # ✅ FIX: User profile se Telegram ID fetch karein
    # Agar user ne settings mein ID daali hai, toh wo yahan aa jayegi
    user_telegram_id = getattr(current_user, "telegram_id", None)

    # Alert Create karo
    new_alert = Alert(
        stock_symbol=clean_sym, 
        target_price=target, 
        email=current_user.email,
        status="active",
        telegram_id=user_telegram_id  # 👈 Ye line data save karegi
    )
    await new_alert.create()
    
    return {"msg": "Alert Added Successfully", "data": new_alert}

# ==========================================
# 3. Delete Alert
# ==========================================
@router.delete("/alert/{alert_id}")
async def delete_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    alert = await Alert.get(alert_id)
    
    if not alert or alert.email != current_user.email:
        raise HTTPException(status_code=404, detail="Alert not found or unauthorized")
    
    await alert.delete()
    return {"msg": "Alert Deleted"}

# ==========================================
# 4. Clear All Alerts
# ==========================================
@router.delete("/clear-all")
async def clear_all_alerts(current_user: User = Depends(get_current_user)):
    await Alert.find(Alert.email == current_user.email).delete()
    return {"msg": "All your alerts deleted!"}
