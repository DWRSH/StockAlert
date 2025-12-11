# File: app/services/finance.py

import requests
import yfinance as yf
import pandas as pd
import feedparser
import urllib.parse
import time
from datetime import datetime
from bs4 import BeautifulSoup
from async_lru import alru_cache  # 👈 Import Caching

import logging
logger = logging.getLogger("StockWatcher")

# --- 1. YAHOO FINANCE (Cached for 60 Seconds) ---
# ttl=60 matlab 60 second tak purana price yaad rakho
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        if not symbol.endswith((".NS", ".BO")):
            symbol = f"{symbol}.NS"
        
        # 'Ticker' is slightly faster for metadata
        ticker = yf.Ticker(symbol)
        
        # Fast fetch: Sirf 'fast_info' use karte hain (Network call lighter hota hai)
        try:
            price = ticker.fast_info['last_price']
            return round(float(price), 2)
        except:
            # Fallback to history if fast_info fails
            data = ticker.history(period="1d")
            if not data.empty:
                return round(float(data["Close"].iloc[-1]), 2)

    except Exception as e:
        logger.warning(f"⚠️ Yahoo Finance failed for {symbol}: {e}")
    return None

# --- 2. GOOGLE FINANCE (Backup) ---
async def scrape_google_finance(symbol: str):
    # ... (Same old code here) ...
    # (Pichla Google Finance code yahan same rahega)
    try:
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        url = f"https://www.google.com/finance/quote/{clean_sym}:NSE"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=3) # Timeout kam kar diya 3s
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
            if price_div:
                return float(price_div.text.replace("₹", "").replace(",", "").strip())
    except: pass
    return None

# --- MAIN FUNCTION (Now Async for Speed) ---
async def get_live_price(symbol: str):
    # Step 1: Try Yahoo (Cached)
    price = await get_yahoo_price(symbol)
    if price: return price

    # Step 2: Try Google (Backup)
    print(f"🔄 Switching to Google Finance for {symbol}...")
    return await scrape_google_finance(symbol)

# --- NEWS (Cached for 10 Minutes) ---
@alru_cache(maxsize=10, ttl=600) 
async def get_google_news(query: str):
    # ... (Same News Logic) ...
    try:
        encoded_query = urllib.parse.quote(f"{query} stock market india")
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