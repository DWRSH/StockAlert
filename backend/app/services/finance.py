import requests
import yfinance as yf
import feedparser
import urllib.parse
import time
from datetime import datetime
from bs4 import BeautifulSoup
from async_lru import alru_cache 
import logging

logger = logging.getLogger("StockWatcher")

# 🛡️ STEALTH SESSION (Cloud Blocker bypass for Render)
yf_session = requests.Session()
yf_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
})

# --- 1. USD to INR Rate Fetcher ---
@alru_cache(maxsize=1, ttl=3600)
async def get_usd_to_inr_rate():
    try:
        ticker = yf.Ticker("USDINR=X", session=yf_session)
        rate = ticker.fast_info.last_price
        return float(rate)
    except Exception as e:
        logger.error(f"Failed to fetch USD rate: {e}")
        return 84.0 

# ✅ NEW: Fetch Array of Last 30 Days Closing Prices
def get_30_days_prices(symbol: str) -> list:
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        hist_1mo = ticker.history(period='1mo')
        
        # BSE (.BO) Fallback to NSE (.NS)
        if hist_1mo.empty and symbol.endswith('.BO'):
            fallback_symbol = symbol.replace('.BO', '.NS')
            ticker = yf.Ticker(fallback_symbol, session=yf_session)
            hist_1mo = ticker.history(period='1mo')

        if not hist_1mo.empty:
            # Extract 'Close' prices, round to 2 decimals, convert to list
            prices_list = [round(float(price), 2) for price in hist_1mo['Close'].tolist()]
            return prices_list
        else:
            return [] # Empty list if no data
            
    except Exception as e:
        logger.warning(f"30-Days history failed for {symbol}: {e}")
        return []

# --- 2. GET STOCK DETAILS (The Stubborn Version for AI) ---
async def get_stock_details(symbol: str):
    try:
        # Clean the symbol
        symbol = symbol.upper().strip()
        
        # Smart Suffix Logic (Try direct first, then try .NS)
        tickers_to_try = [symbol]
        if not symbol.endswith((".NS", ".BO")):
            tickers_to_try.append(f"{symbol}.NS")

        for sym in tickers_to_try:
            try:
                logger.info(f"🔍 AI FETCH: Trying to get data for '{sym}'...")
                ticker = yf.Ticker(sym, session=yf_session)
                
                # 🛡️ FIX: Using history() instead of fast_info because it's 10x more reliable on Render
                hist = ticker.history(period="1d")
                
                if hist.empty:
                    logger.warning(f"⚠️ AI FETCH: No recent trading data for '{sym}'.")
                    continue # Try the next symbol in the list
                    
                price = round(float(hist['Close'].iloc[-1]), 2)
                
                # Safe Currency Detection
                currency = "INR" if sym.endswith((".NS", ".BO")) else "USD"
                try:
                    currency = ticker.fast_info.currency
                except:
                    pass # Keep the default INR/USD fallback
                    
                # Get the 30-day array
                price_history = get_30_days_prices(sym)
                
                logger.info(f"✅ AI FETCH SUCCESS: '{sym}' | Price: {price} | History Data points: {len(price_history)}")
                
                return {
                    "symbol": sym,
                    "price": price,
                    "currency": currency,
                    "price_history": price_history,
                    "is_us": currency == 'USD'
                }
            except Exception as e:
                logger.warning(f"⚠️ AI FETCH ERROR for '{sym}': {e}")
                continue # Try next symbol
                
        # Agar dono try fail ho gaye tab ye line chalegi
        logger.error(f"❌ AI FETCH COMPLETELY FAILED for '{symbol}'")
        return None
        
    except Exception as e:
        logger.error(f"Fatal error in get_stock_details: {e}")
        return None

# --- 3. Fast Yahoo Price (For Quick Alerts) ---
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        try: 
            # Using history here as well to avoid fast_info cloud blocks
            hist = ticker.history(period="1d")
            if not hist.empty:
                return round(float(hist['Close'].iloc[-1]), 2)
        except: 
            pass
            
        if not symbol.endswith((".NS", ".BO")):
            ticker = yf.Ticker(f"{symbol}.NS", session=yf_session)
            hist = ticker.history(period="1d")
            if not hist.empty:
                return round(float(hist['Close'].iloc[-1]), 2)
    except: 
        pass
    return None

# --- 4. Backup Google Finance ---
async def scrape_google_finance(symbol: str):
    try:
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        url = f"https://www.google.com/finance/quote/{clean_sym}:NSE"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(url, headers=headers, timeout=3)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
            if price_div: return float(price_div.text.replace("₹", "").replace("$", "").replace(",", "").strip())
    except: pass
    return None

# --- MAIN LIVE PRICE FUNCTION ---
async def get_live_price(symbol: str):
    price = await get_yahoo_price(symbol)
    if price: return price
    return await scrape_google_finance(symbol)

# --- News ---
@alru_cache(maxsize=10, ttl=600) 
async def get_google_news(query: str):
    try:
        encoded_query = urllib.parse.quote(f"{query} stock news")
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(rss_url)
        return [{"title": e.title, "link": e.link, "publisher": e.source.title if 'source' in e else "Google News", "time": datetime.fromtimestamp(time.mktime(e.published_parsed)).strftime('%d %b, %H:%M') if e.get('published_parsed') else "Recent", "img": None} for e in feed.entries[:8]]
    except: return []
