from fastapi import APIRouter, Depends, HTTPException
from app.db import database 
from app.utils.auth import get_current_user 
from pydantic import BaseModel
from datetime import datetime

# ✅ NEW IMPORTS: Finance Service se data lene ke liye
from app.services.finance import get_stock_details, get_usd_to_inr_rate

router = APIRouter()

# --- Models ---
class Transaction(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str = "BUY"

# --- Routes ---

@router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
        
    cursor = database.db.portfolio.find({"email": user["email"]})
    holdings = await cursor.to_list(length=100)
    
    # 1. Aaj ka USD to INR rate layein (e.g., 84.5)
    usd_rate = await get_usd_to_inr_rate()
    
    updated_holdings = []
    
    for h in holdings:
        # 2. Live Details Layein (Price + Currency)
        details = await get_stock_details(h["symbol"])
        
        # Default fallback values
        current_price = h["avg_price"]
        currency = "INR"
        
        if details:
            current_price = details["price"]
            currency = details["currency"] # 'USD' or 'INR'
            
        # 3. Currency Logic
        if currency == "USD":
            # Agar US Stock hai:
            display_price = current_price        # UI par Dollar dikhayenge ($150)
            currency_symbol = "$"
            # Total Value ke liye INR me convert karein
            value_inr = (current_price * h["quantity"]) * usd_rate 
        else:
            # Agar Indian Stock hai:
            display_price = current_price
            currency_symbol = "₹"
            value_inr = (current_price * h["quantity"])

        # 4. Data Attach karein
        h["current_price"] = display_price
        h["currency"] = currency
        h["currency_symbol"] = currency_symbol
        h["value_inr"] = value_inr # Frontend isse Total Portfolio Value calculate karega
        h["_id"] = str(h["_id"])   # ObjectId convert to string
        
        updated_holdings.append(h)
        
    return updated_holdings

@router.post("/portfolio/transaction")
async def add_transaction(txn: Transaction, user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    email = user["email"]
    # Symbol ko Upper Case karein (e.g. 'aapl' -> 'AAPL')
    clean_symbol = txn.symbol.upper().strip()
    
    existing = await database.db.portfolio.find_one({"email": email, "symbol": clean_symbol})

    if txn.type == "BUY":
        if existing:
            new_qty = existing["quantity"] + txn.quantity
            # Weighted Average Price Calculation
            total_cost = (existing["quantity"] * existing["avg_price"]) + (txn.quantity * txn.price)
            new_avg = total_cost / new_qty
            
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "avg_price": new_avg}}
            )
        else:
            new_holding = {
                "email": email,
                "symbol": clean_symbol,
                "quantity": txn.quantity,
                "avg_price": txn.price, # Price wahi save karein jo currency hai ($150 ya ₹2000)
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
