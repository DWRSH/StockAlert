import requests
import yfinance as yf
import pandas as pd
import feedparser
import urllib.parse
import time
from datetime import datetime
from bs4 import BeautifulSoup
from async_lru import alru_cache 

import logging
logger = logging.getLogger("StockWatcher")

# --- 1. USD to INR Rate Fetcher ---
@alru_cache(maxsize=1, ttl=3600) # 1 Hour Cache
async def get_usd_to_inr_rate():
    try:
        ticker = yf.Ticker("USDINR=X")
        rate = ticker.fast_info.last_price
        return float(rate)
    except Exception as e:
        logger.error(f"Failed to fetch USD rate: {e}")
        return 84.0 

# ✅ NEW HELPER: Bulletproof 1-Month Return Calculator
def calculate_1mo_return(ticker: yf.Ticker) -> str:
    try:
        hist_1mo = ticker.history(period='1mo')
        if len(hist_1mo) >= 2:
            start_price = hist_1mo['Close'].iloc[0]
            end_price = hist_1mo['Close'].iloc[-1]
            
            # Percentage Formula: ((New - Old) / Old) * 100
            change_percent = ((end_price - start_price) / start_price) * 100
            
            # Returns formatted string like "+5.20%" or "-2.10%"
            return f"{change_percent:+.2f}%"
    except Exception as e:
        logger.warning(f"1-Month history failed: {e}")
    return "N/A"

# --- 2. Get Stock Details (Price + Currency + 1-Mo Return) ---
async def get_stock_details(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        
        try:
            # Phele direct symbol try karega (US Stocks)
            price = ticker.fast_info.last_price
            currency = ticker.fast_info.currency 
            change_1mo = calculate_1mo_return(ticker) # 👈 Calculates 1-mo return
            
        except:
            # Agar fail hua, toh .NS laga kar try karega (Indian Stocks)
            if not symbol.endswith((".NS", ".BO")):
                symbol = f"{symbol}.NS"
                ticker = yf.Ticker(symbol)
                price = ticker.fast_info.last_price
                currency = ticker.fast_info.currency
                change_1mo = calculate_1mo_return(ticker) # 👈 Calculates 1-mo return
            else:
                return None

        # Dictionary ab 1-Month Return bhi return karegi!
        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "currency": currency,
            "change_1mo": change_1mo,  # 👈 AI ko bhejne ke liye data
            "is_us": currency == 'USD'
        }
    except Exception as e:
        logger.warning(f"Detail fetch failed for {symbol}: {e}")
        return None

# --- 3. YAHOO FINANCE PRICE (Optimized for Alerts) ---
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        try:
            price = ticker.fast_info.last_price
            return round(float(price), 2)
        except:
            pass
            
        if not symbol.endswith((".NS", ".BO")):
            ticker = yf.Ticker(f"{symbol}.NS")
            price = ticker.fast_info.last_price
            return round(float(price), 2)
            
    except Exception as e:
        pass
    return None

# --- 4. GOOGLE FINANCE (Backup - Indian Only) ---
async def scrape_google_finance(symbol: str):
    try:
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        url = f"https://www.google.com/finance/quote/{clean_sym}:NSE"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
            if price_div:
                return float(price_div.text.replace("₹", "").replace("$", "").replace(",", "").strip())
    except: pass
    return None

# --- MAIN FUNCTION ---
async def get_live_price(symbol: str):
    price = await get_yahoo_price(symbol)
    if price: return price
    return await scrape_google_finance(symbol)

# --- NEWS ---
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
