# File: app/routers/alerts.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List

# ✅ Correct Imports
from app.models.user import User
from app.models.alert import Alert
# get_current_user ab auth router me hai (circular import fix ke baad)
from app.routers.auth import get_current_user 

router = APIRouter()

# ==========================================
# 1. Get All Alerts for Logged-in User
# ==========================================
@router.get("/alerts", response_model=List[Alert])
async def get_my_alerts(current_user: User = Depends(get_current_user)):
    # User ke email se match hone wale alerts laayein
    # Sort by created_at (Newest first)
    return await Alert.find(Alert.email == current_user.email).sort("-created_at").to_list()

# ==========================================
# 2. Add New Alert
# ==========================================
@router.post("/add-alert")
async def add_alert(symbol: str, target: float, current_user: User = Depends(get_current_user)):
    clean_sym = symbol.upper().strip()
    
    # Alert Create karo
    new_alert = Alert(
        stock_symbol=clean_sym, 
        target_price=target, 
        email=current_user.email,
        status="active" # ✅ Explicitly 'active' set kiya (Admin stats ke liye)
    )
    await new_alert.create()
    
    return {"msg": "Alert Added Successfully", "data": new_alert}

# ==========================================
# 3. Delete Alert
# ==========================================
@router.delete("/alert/{alert_id}")
async def delete_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    alert = await Alert.get(alert_id)
    
    # Check: Alert exist karta hai? Aur kya ye usi user ka hai?
    if not alert or alert.email != current_user.email:
        raise HTTPException(status_code=404, detail="Alert not found or unauthorized")
    
    await alert.delete()
    return {"msg": "Alert Deleted"}

# ==========================================
# 4. Clear All Alerts (Optional)
# ==========================================
@router.delete("/clear-all")
async def clear_all_alerts(current_user: User = Depends(get_current_user)):
    # Sirf apne alerts delete karein
    await Alert.find(Alert.email == current_user.email).delete()
    return {"msg": "All your alerts deleted!"}
