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

# 🛡️ STEALTH SESSION (Cloud Blocker bypass)
yf_session = requests.Session()
yf_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
})

@alru_cache(maxsize=1, ttl=3600)
async def get_usd_to_inr_rate():
    try:
        ticker = yf.Ticker("USDINR=X", session=yf_session)
        rate = ticker.fast_info.last_price
        return float(rate)
    except: return 84.0 

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

# --- 2. Get Stock Details ---
async def get_stock_details(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        try:
            price = ticker.fast_info.last_price
            currency = ticker.fast_info.currency 
            price_history = get_30_days_prices(symbol) # 👈 Calling new function
        except:
            if not symbol.endswith((".NS", ".BO")):
                symbol = f"{symbol}.NS"
                ticker = yf.Ticker(symbol, session=yf_session)
                price = ticker.fast_info.last_price
                currency = ticker.fast_info.currency
                price_history = get_30_days_prices(symbol) # 👈 Calling new function
            else:
                return None

        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "currency": currency,
            "price_history": price_history,  # 👈 Array of prices goes here
            "is_us": currency == 'USD'
        }
    except Exception as e:
        logger.warning(f"Detail fetch failed for {symbol}: {e}")
        return None

# --- Fast Yahoo Price (For Alerts) ---
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        try: return round(float(ticker.fast_info.last_price), 2)
        except: pass
        if not symbol.endswith((".NS", ".BO")):
            ticker = yf.Ticker(f"{symbol}.NS", session=yf_session)
            return round(float(ticker.fast_info.last_price), 2)
    except: pass
    return None

# --- Backup Google Finance ---
async def scrape_google_finance(symbol: str):
    try:
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        url = f"https://www.google.com/finance/quote/{clean_sym}:NSE"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
            if price_div: return float(price_div.text.replace("₹", "").replace("$", "").replace(",", "").strip())
    except: pass
    return None

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
