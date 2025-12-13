from fastapi import APIRouter, Depends, HTTPException
from app.db import database 
from app.utils.auth import get_current_user 
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf # ✅ NEW: Live Price ke liye

router = APIRouter()

# --- Models ---
class Transaction(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str = "BUY"

# --- Helper to get Live Price ---
def get_live_price(symbol):
    try:
        # User agar "RELIANCE" likhe to "RELIANCE.NS" bana do (NSE ke liye)
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") and not symbol.endswith(".BO") else symbol
        
        stock = yf.Ticker(ticker_symbol)
        data = stock.history(period="1d")
        
        if not data.empty:
            # Latest closing price uthao
            return data["Close"].iloc[-1]
        return None
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return None

# --- Routes ---

@router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
        
    cursor = database.db.portfolio.find({"email": user["email"]})
    holdings = await cursor.to_list(length=100)
    
    # ✅ Process Holdings with Live Data
    updated_holdings = []
    for h in holdings:
        # Live Price Fetch karein
        current_price = get_live_price(h["symbol"])
        
        # Agar Live Price nahi mila, to Avg Price hi use karo (Safety ke liye)
        final_price = current_price if current_price else h["avg_price"]
        
        # Data structure mein add karein
        h["current_price"] = final_price
        h["_id"] = str(h["_id"]) # ObjectId convert
        updated_holdings.append(h)
        
    return updated_holdings

@router.post("/portfolio/transaction")
async def add_transaction(txn: Transaction, user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    email = user["email"]
    existing = await database.db.portfolio.find_one({"email": email, "symbol": txn.symbol})

    if txn.type == "BUY":
        if existing:
            new_qty = existing["quantity"] + txn.quantity
            total_cost = (existing["quantity"] * existing["avg_price"]) + (txn.quantity * txn.price)
            new_avg = total_cost / new_qty
            
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "avg_price": new_avg}}
            )
        else:
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
