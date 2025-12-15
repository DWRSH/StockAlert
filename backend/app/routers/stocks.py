# File: app/routers/stocks.py

from fastapi import APIRouter
from app.services.finance import get_live_price, get_google_news
from app.services.ai_service import ai_engine
import requests
import yfinance as yf
import pandas as pd
from async_lru import alru_cache

router = APIRouter()

# ==========================================
# 1. HELPER: CACHED SEARCH (Internal Function)
# ==========================================
# Search results ko 1 ghante (3600 sec) tak cache karega
@alru_cache(maxsize=200, ttl=3600)
async def fetch_yahoo_search(query: str):
    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
        headers = { "User-Agent": "Mozilla/5.0" }
        res = requests.get(url, headers=headers, timeout=3)
        data = res.json()
        suggestions = []
        if "quotes" in data:
            for q in data["quotes"]:
                # Sirf Indian Stocks (.NS / .BO) filter karein
                if q.get("symbol", "").endswith((".NS", ".BO")):
                    suggestions.append({
                        "symbol": q.get("symbol"), 
                        "name": q.get("longname"), 
                        "type": q.get("quoteType")
                    })
        return suggestions
    except: return []

# ==========================================
# 2. API ROUTES
# ==========================================

# --- Market Indices (Nifty 50 & Sensex) ---
@router.get("/indices")
async def get_market_indices():
    try:
        # 'auto_adjust=True' warning fix karne ke liye hai
        nifty_data = yf.download("^NSEI", period="1d", auto_adjust=True, progress=False)
        sensex_data = yf.download("^BSESN", period="1d", auto_adjust=True, progress=False)
        
        # Data Flattening (Multi-index handling)
        if not nifty_data.empty and isinstance(nifty_data.columns, pd.MultiIndex):
            nifty_data.columns = nifty_data.columns.get_level_values(0)
        
        if not sensex_data.empty and isinstance(sensex_data.columns, pd.MultiIndex):
            sensex_data.columns = sensex_data.columns.get_level_values(0)

        # Last closing price nikalna
        nifty = round(float(nifty_data["Close"].iloc[-1]), 2) if not nifty_data.empty else 0.0
        sensex = round(float(sensex_data["Close"].iloc[-1]), 2) if not sensex_data.empty else 0.0
        
        return {"nifty": nifty, "sensex": sensex}
    except Exception as e:
        print(f"Indices Error: {e}")
        return {"nifty": 0.0, "sensex": 0.0}

# --- Search Stock Route ---
@router.get("/search-stock")
async def search_stock(query: str):
    # Cached helper function call kar rahe hain
    return await fetch_yahoo_search(query)

# --- Graph Data (History) ---
@router.get("/stock-history/{symbol}")
async def get_stock_history(symbol: str):
    try:
        clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")
        # Pehle NSE try karo, fir BSE
        tickers_to_try = [f"{clean_sym}.NS", f"{clean_sym}.BO"]
        
        for ticker_name in tickers_to_try:
            try:
                # 1 Month ka data, daily candle
                data = yf.download(ticker_name, period="1mo", interval="1d", auto_adjust=True, progress=False)
                
                if not data.empty:
                    # Flatten logic
                    if isinstance(data.columns, pd.MultiIndex):
                        data.columns = data.columns.get_level_values(0)
                    
                    data = data.reset_index()
                    result = []
                    
                    for _, row in data.iterrows():
                        try:
                            # Date formatting: "12 Dec"
                            date_val = row['Date'].strftime("%d %b")
                            close_val = row['Close']
                            
                            # Float conversion safe logic
                            price_val = float(close_val.iloc[0]) if hasattr(close_val, 'iloc') else float(close_val)
                            
                            if price_val > 0:
                                result.append({"date": date_val, "price": round(price_val, 2)})
                        except: continue
                    
                    if result: return result
            except: continue
        return []
    except: return []

# --- AI Analysis Route ---
@router.get("/analyze-stock/{symbol}")
async def analyze_stock(symbol: str):
    # 'await' zaroori hai kyunki service ab async hai
    current_price = await get_live_price(symbol)
    
    if not current_price:
        return {"analysis": "Could not fetch stock price. Please try again."}
    
    # 1 Month Change nikalne ka logic (Simple Approximation)
    # Real production app mein hum history se calculate karte hain
    change_pct = "N/A" 
    
    return {"analysis": ai_engine.analyze(symbol, current_price, change_pct, "Yahoo Finance")}

# --- News Routes ---
@router.get("/market-news")
async def get_market_news_route():
    return await get_google_news("Indian Stock Market")

@router.get("/stock-news/{symbol}")
async def get_stock_news_route(symbol: str):
    return await get_google_news(symbol)
