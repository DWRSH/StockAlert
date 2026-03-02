from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional

class Alert(Document):
    stock_symbol: str
    target_price: float
    email: str
    
    # ✅ NAYA FIELD: Alert Direction (UP ya DOWN)
    # Ye batayega ki alert price badhne par trigger karna hai ya girne par
    direction: str = "UP" 

    # ✅ NEW FIELD: Telegram ID
    # Isko store karne se Background worker fast kaam karega
    telegram_id: Optional[str] = None 

    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Trigger time tracking
    triggered_at: Optional[datetime] = None

    class Settings:
        name = "alerts"
