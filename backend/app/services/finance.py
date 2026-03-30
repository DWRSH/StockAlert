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

# --- 1. USD to INR Rate Fetcher (New) ---
@alru_cache(maxsize=1, ttl=3600) # 1 Hour Cache
async def get_usd_to_inr_rate():
    try:
        # Yahoo Finance symbol for USD/INR is 'USDINR=X'
        ticker = yf.Ticker("USDINR=X")
        rate = ticker.fast_info.last_price
        return float(rate)
    except Exception as e:
        logger.error(f"Failed to fetch USD rate: {e}")
        return 84.0 # Fallback rate if API fails

# --- 2. Get Stock Details (Price + Currency) ---
# Ye function Portfolio page ke liye zaroori hai
async def get_stock_details(symbol: str):
    try:
        # Logic: Agar suffix (.NS) nahi hai, toh pehle direct try karein (US Stocks ke liye)
        # Agar fail ho, aur suffix bhi nahi hai, tab .NS lagayein
        
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        
        try:
            price = info.last_price
            currency = info.currency # USD or INR
        except:
            # Agar direct symbol fail hua (e.g. RELIANCE without .NS)
            if not symbol.endswith((".NS", ".BO")):
                symbol = f"{symbol}.NS"
                ticker = yf.Ticker(symbol)
                info = ticker.fast_info
                price = info.last_price
                currency = info.currency
            else:
                return None

        return {
            "symbol": symbol,
            "price": price,
            "currency": currency,
            "is_us": currency == 'USD'
        }
    except Exception as e:
        logger.warning(f"Detail fetch failed for {symbol}: {e}")
        return None

# --- 3. YAHOO FINANCE PRICE (Optimized) ---
@alru_cache(maxsize=100, ttl=60) 
async def get_yahoo_price(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        
        # 1. Try Direct Symbol (For US Stocks like AAPL)
        try:
            price = ticker.fast_info.last_price
            return round(float(price), 2)
        except:
            pass
            
        # 2. If Failed & No Suffix, Try appending .NS (For Indian Stocks)
        if not symbol.endswith((".NS", ".BO")):
            ticker = yf.Ticker(f"{symbol}.NS")
            price = ticker.fast_info.last_price
            return round(float(price), 2)
            
    except Exception as e:
        # logger.warning(f"Yahoo failed for {symbol}: {e}")
        pass
    return None

# --- 4. GOOGLE FINANCE (Backup - Indian Only) ---
# Google Finance URL structure differs for US/India, so we keep this mostly for INR fallback
async def scrape_google_finance(symbol: str):
    try:
        # US stocks usually don't need this backup, assume Indian context if fallback needed
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
    # Step 1: Try Yahoo (Handles both US & India)
    price = await get_yahoo_price(symbol)
    if price: return price

    # Step 2: Try Google (Backup for Indian stocks)
    return await scrape_google_finance(symbol)

# --- NEWS ---
@alru_cache(maxsize=10, ttl=600) 
async def get_google_news(query: str):
    try:
        # Search query ko generic banaya taaki US news bhi aaye
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
