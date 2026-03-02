from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.user import User
from app.models.alert import Alert
from app.routers.auth import get_current_user 

# ✅ NEW IMPORT: Live price fetch karne ke liye (Aapka exact path check kar lena)
from app.services.finance import get_live_price

router = APIRouter()

# ==========================================
# 1. Get All Alerts
# ==========================================
@router.get("/alerts", response_model=List[Alert])
async def get_my_alerts(current_user: User = Depends(get_current_user)):
    # Sort by created_at (Newest first)
    return await Alert.find(Alert.email == current_user.email).sort("-created_at").to_list()

# ==========================================
# 2. Add New Alert (✅ UPDATED FOR UP/DOWN LOGIC)
# ==========================================
@router.post("/add-alert")
async def add_alert(symbol: str, target: float, current_user: User = Depends(get_current_user)):
    clean_sym = symbol.upper().strip()
    
    # 1. User profile se Telegram ID fetch karein
    user_telegram_id = getattr(current_user, "telegram_id", None)

    # 2. ✅ FIX: Fetch current live price to determine direction
    current_price = await get_live_price(clean_sym)
    
    if current_price is None:
        raise HTTPException(status_code=400, detail=f"Could not fetch current price for {clean_sym}. Please try again.")

    # 3. ✅ FIX: Determine if it's a "Buy on Dip" (DOWN) or "Breakout" (UP) alert
    direction = "UP"
    if target < current_price:
        direction = "DOWN"

    # 4. Alert Create karo
    new_alert = Alert(
        stock_symbol=clean_sym, 
        target_price=target, 
        direction=direction, # 👈 Naya field yahan save hoga
        email=current_user.email,
        status="active",
        telegram_id=user_telegram_id 
    )
    await new_alert.create()
    
    return {
        "msg": f"Alert set for {clean_sym} when it goes {direction} to {target}", 
        "data": new_alert,
        "current_price": current_price,
        "direction": direction
    }

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
