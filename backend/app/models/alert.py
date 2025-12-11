from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional

class Alert(Document):
    stock_symbol: str
    target_price: float
    email: str
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 👇 NEW FIELD (Pata chale kab alert bheja gaya tha)
    triggered_at: Optional[datetime] = None

    class Settings:
        name = "alerts"
