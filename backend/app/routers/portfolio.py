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

# --- Helper to get Live Price AND Name ---
def get_live_data(symbol):
    try:
        # NSE symbol conversion logic
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") and not symbol.endswith(".BO") else symbol
        
        stock = yf.Ticker(ticker_symbol)
        
        # 1. Get Price History
        data = stock.history(period="1d")
        current_price = 0.0
        if not data.empty:
            current_price = data["Close"].iloc[-1]

        # 2. Get Company Name (Metadata)
        # Note: .info call thoda slow ho sakta hai, isliye hum isse try block me rakhte hain
        company_name = symbol # Default fallback is Symbol itself
        try:
            if 'longName' in stock.info:
                company_name = stock.info['longName']
        except:
            pass # Agar info fetch fail ho jaye to Symbol hi naam rahega

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
        # Live Data (Price + Name) fetch karein
        live_data = get_live_data(h["symbol"])
        
        # Default values agar API fail ho
        final_price = h["avg_price"]
        final_name = h.get("name", h["symbol"]) # Agar DB me name hai to wo lo, nahi to symbol

        if live_data:
            final_price = live_data["price"] if live_data["price"] > 0 else h["avg_price"]
            
            # AGAR Database me Name missing hai (Purane records ke liye), to Live API wala name use karo
            if "name" not in h or h["name"] is None:
                final_name = live_data["name"]

        # Data structure update karein
        h["current_price"] = final_price
        h["name"] = final_name  # <-- YAHAN NAME ADD KIYA
        h["_id"] = str(h["_id"]) 
        
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
            
            # Update karte waqt agar pehle name nahi tha, to ab save karne ki koshish nahi kar rahe 
            # kyunki wo slow ho jayega. Read time pe handle kar lenge.
            await database.db.portfolio.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "avg_price": new_avg}}
            )
        else:
            # --- NEW HOLDING LOGIC ---
            # Jab pehli baar share khareed rahe hain, tabhi NAAM fetch karke DB me save kar lo
            live_data = get_live_data(txn.symbol)
            company_name = live_data["name"] if live_data else txn.symbol

            new_holding = {
                "email": email,
                "symbol": txn.symbol,
                "name": company_name, # ✅ Saving Name permanently to DB
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
