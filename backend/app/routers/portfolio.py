from fastapi import APIRouter, Depends, HTTPException
from app.db import database 
from app.utils.auth import get_current_user 
from pydantic import BaseModel
from datetime import datetime
import yfinance as yf 

router = APIRouter()

# --- Models ---
class Transaction(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str = "BUY"

# --- ✅ NEW HELPER: Get Price AND Name ---
def get_live_data(symbol):
    try:
        # NSE symbol adjust karo
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") and not symbol.endswith(".BO") else symbol
        
        stock = yf.Ticker(ticker_symbol)
        
        # 1. Price nikalo
        hist = stock.history(period="1d")
        current_price = hist["Close"].iloc[-1] if not hist.empty else 0.0
        
        # 2. Company Name nikalo (yf.info se)
        # Agar naam na mile to Symbol hi wapas kar do fallback ke liye
        company_name = stock.info.get('longName', symbol)
        
        return {"price": current_price, "name": company_name}

    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

# --- Routes ---

@router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
        
    cursor = database.db.portfolio.find({"email": user["email"]})
    holdings = await cursor.to_list(length=100)
    
    updated_holdings = []
    for h in holdings:
        # ✅ Ab hum Price aur Name dono layenge
        live_data = get_live_data(h["symbol"])
        
        if live_data:
            h["current_price"] = live_data["price"]
            
            # Agar database me pehle se naam saved nahi hai, to live data wala naam use karo
            if "name" not in h or not h["name"]:
                h["name"] = live_data["name"]
        else:
            # Fallback agar API fail ho jaye
            h["current_price"] = h["avg_price"]
            h["name"] = h["symbol"] # Name nahi mila to symbol dikhao

        h["_id"] = str(h["_id"]) 
        updated_holdings.append(h)
        
    return updated_holdings

@router.post("/portfolio/transaction")
async def add_transaction(txn: Transaction, user=Depends(get_current_user)):
    if database.db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    email = user["email"]
    existing = await database.db.portfolio.find_one({"email": email, "symbol": txn.symbol})

    # ✅ Transaction ke time hi Name fetch karke DB me save kar lo
    # Isse portfolio load fast hoga agli baar
    company_name = txn.symbol # Default
    try:
        live_data = get_live_data(txn.symbol)
        if live_data:
            company_name = live_data["name"]
    except:
        pass

    if txn.type == "BUY":
        if existing:
            new_qty = existing["quantity"] + txn.quantity
            total_cost = (existing["quantity"] * existing["avg_price"]) + (txn.quantity * txn.price)
            new_avg = total_cost / new_qty
            
            # Update karte waqt naam bhi ensure kar lo
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "avg_price": new_avg, "name": company_name}}
            )
        else:
            new_holding = {
                "email": email,
                "symbol": txn.symbol,
                "name": company_name, # ✅ DB me Name save kar rahe hain
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
