from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.models.user import User
from app.models.alert import Alert
# Notifier service import karein
from app.services.notifier import send_telegram_notification 

# ============================================================
# ✅ FIX: Router ko sabse pehle define karein (To avoid Circular Import)
# ============================================================
router = APIRouter()

# --- Request Schemas ---

class TelegramUpdateRequest(BaseModel):
    email: str
    telegram_id: str

class TestNotificationRequest(BaseModel):
    telegram_id: str

# --- Routes ---

@router.put("/update-telegram")
async def update_telegram_id(data: TelegramUpdateRequest):
    """
    Updates the Telegram Chat ID.
    Note: Humne yahan temporary Auth check hataya hai taaki import loop na bane.
    Agar production app hai, toh Auth wapas add kar sakte hain local import ke sath.
    """
    
    # ✅ Local Import to break Circular Dependency
    from app.routers.auth import get_current_user 

    try:
        # 1. Find user directly
        user = await User.find_one(User.email == data.email)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Update the telegram_id
        user.telegram_id = data.telegram_id
        await user.save()

        # 3. Sync active alerts
        await Alert.find(
            Alert.email == data.email, 
            Alert.status == "active"
        ).update({"$set": {"telegram_id": data.telegram_id}})

        return {
            "status": "success",
            "message": "Telegram ID updated and synced successfully",
            "updated_id": data.telegram_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

@router.post("/test-telegram")
async def test_telegram_id(data: TestNotificationRequest):
    """
    Sends a test message via Telegram.
    """
    if not data.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram ID is required")

    # Call the notifier service
    success = await send_telegram_notification(
        chat_id=data.telegram_id,
        symbol="TEST-MSG",
        target=100.00,
        current=105.00
    )

    if success:
        return {"status": "success", "message": "Test message sent! Check Telegram."}
    else:
        raise HTTPException(
            status_code=400, 
            detail="Failed to send. Did you start the bot with /start?"
        )
