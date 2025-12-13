from fastapi import APIRouter, Depends, HTTPException
# ❌ OLD: from app.db.database import db  (Ye galat tha)
# ✅ NEW: Hum poora module import karenge
from app.db import database 
from app.utils.auth import get_current_user 
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- Models ---
class Transaction(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str = "BUY" # BUY or SELL

# --- Routes ---

@router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    # ✅ FIX: Ab hum database.db use karenge (Jo initialize ho chuka hai)
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
        
    cursor = database.db.portfolio.find({"email": user["email"]})
    holdings = await cursor.to_list(length=100)
    
    # Optional: Convert ObjectId to string if needed by frontend
    for h in holdings:
        h["_id"] = str(h["_id"])
        
    return holdings

@router.post("/portfolio/transaction")
async def add_transaction(txn: Transaction, user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    email = user["email"]
    
    # ✅ FIX: database.db use karein
    existing = await database.db.portfolio.find_one({"email": email, "symbol": txn.symbol})

    if txn.type == "BUY":
        if existing:
            # Average Price Logic
            new_qty = existing["quantity"] + txn.quantity
            total_cost = (existing["quantity"] * existing["avg_price"]) + (txn.quantity * txn.price)
            new_avg = total_cost / new_qty
            
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "avg_price": new_avg}}
            )
        else:
            # Naya Stock
            new_holding = {
                "email": email,
                "symbol": txn.symbol,
                "quantity": txn.quantity,
                "avg_price": txn.price,
                "created_at": datetime.utcnow()
            }
            await database.db.portfolio.insert_one(new_holding)
            
    elif txn.type == "SELL":
        if not existing or existing["quantity"] < txn.quantity:
            raise HTTPException(status_code=400, detail="Not enough quantity to sell")
        
        new_qty = existing["quantity"] - txn.quantity
        
        if new_qty == 0:
            await database.db.portfolio.delete_one({"_id": existing["_id"]})
        else:
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty}}
            )

    return {"msg": "Transaction Successful"}
