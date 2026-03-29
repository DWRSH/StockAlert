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

# 🛡️ THE SHIELD: Custom Session to Bypass Yahoo's Cloud Blocker on Render
yf_session = requests.Session()
yf_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
})

@alru_cache(maxsize=1, ttl=3600)
async def get_usd_to_inr_rate():
    try:
        ticker = yf.Ticker("USDINR=X", session=yf_session)
        rate = ticker.fast_info.last_price
        return float(rate)
    except Exception as e:
        logger.error(f"Failed to fetch USD rate: {e}")
        return 84.0 

# ✅ BULLETPROOF & STEALTH 1-MONTH RETURN CALCULATOR
def calculate_1mo_return(symbol: str) -> str:
    try:
        # Pass the stealth session here!
        ticker = yf.Ticker(symbol, session=yf_session)
        hist_1mo = ticker.history(period='1mo')
        
        # Fallback for BSE stocks if data is empty
        if hist_1mo.empty and symbol.endswith('.BO'):
            fallback_symbol = symbol.replace('.BO', '.NS')
            ticker = yf.Ticker(fallback_symbol, session=yf_session)
            hist_1mo = ticker.history(period='1mo')

        if len(hist_1mo) >= 2:
            start_price = hist_1mo['Close'].iloc[0]
            end_price = hist_1mo['Close'].iloc[-1]
            
            # Formula: ((New - Old) / Old) * 100
            change_percent = ((end_price - start_price) / start_price) * 100
            return f"{change_percent:+.2f}%"
        else:
            # Agar abhi bhi fail ho, toh specific error dega taaki humein pata chale
            return "N/A (Blocked or No Data)"
            
    except Exception as e:
        logger.warning(f"1-Month history failed for {symbol}: {e}")
        return f"N/A (Error: {str(e)[:15]})"

# --- 2. Get Stock Details (Used for Portfolio & AI) ---
async def get_stock_details(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        try:
            # Try Direct Symbol
            price = ticker.fast_info.last_price
            currency = ticker.fast_info.currency 
            change_1mo = calculate_1mo_return(symbol)
        except:
            # Try Appending .NS
            if not symbol.endswith((".NS", ".BO")):
                symbol = f"{symbol}.NS"
                ticker = yf.Ticker(symbol, session=yf_session)
                price = ticker.fast_info.last_price
                currency = ticker.fast_info.currency
                change_1mo = calculate_1mo_return(symbol)
            else:
                return None

        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "currency": currency,
            "change_1mo": change_1mo,  
            "is_us": currency == 'USD'
        }
    except Exception as e:
        logger.warning(f"Detail fetch failed for {symbol}: {e}")
        return None

# --- 3. Fast Yahoo Price ---
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        try:
            return round(float(ticker.fast_info.last_price), 2)
        except:
            pass
        if not symbol.endswith((".NS", ".BO")):
            ticker = yf.Ticker(f"{symbol}.NS", session=yf_session)
            return round(float(ticker.fast_info.last_price), 2)
    except:
        pass
    return None

# --- 4. Google Finance Backup ---
async def scrape_google_finance(symbol: str):
    try:
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        url = f"https://www.google.com/finance/quote/{clean_sym}:NSE"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(url, headers=headers, timeout=3)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
            if price_div:
                return float(price_div.text.replace("₹", "").replace("$", "").replace(",", "").strip())
    except: pass
    return None

# --- MAIN LIVE PRICE FUNCTION ---
async def get_live_price(symbol: str):
    price = await get_yahoo_price(symbol)
    if price: return price
    return await scrape_google_finance(symbol)

# --- NEWS FUNCTION ---
@alru_cache(maxsize=10, ttl=600) 
async def get_google_news(query: str):
    try:
        encoded_query = urllib.parse.quote(f"{query} stock news")
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(rss_url)
        news_items = []
        for entry in feed.entries[:8]:
            news_items.append({
                "title": entry.title,
                "link": entry.link,
                "publisher": entry.source.title if 'source' in entry else "Google News",
                "time": datetime.fromtimestamp(time.mktime(entry.published_parsed)).strftime('%d %b, %H:%M') if entry.get('published_parsed') else "Recent",
                "img": None 
            })
        return news_items
    except: return []
