# File: app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

# Local Imports
from app.core.config import settings
from app.db.database import init_db
# 👇 Dhyan dein: Yahan 'stocks' import hona zaroori hai
from app.routers import auth, stocks, alerts 
from app.services.background import track_stock_prices

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StockWatcher")

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Server Starting...")
    await init_db()
    
    # Scheduler Logic (Background jobs)
    if not scheduler.running:
        scheduler.add_job(track_stock_prices, 'interval', seconds=60)
        scheduler.start()
    
    yield
    
    logger.info("🛑 Server Shutting Down...")

app = FastAPI(lifespan=lifespan, title="Stock Alert System")

# CORS (Frontend connection ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇👇 YE LINES SABSE ZAROORI HAIN 👇👇
app.include_router(auth.router, tags=["Auth"])
app.include_router(stocks.router, tags=["Stocks"]) # 👈 Kya ye line aapke code mein hai?
app.include_router(alerts.router, tags=["Alerts"])

@app.get("/")
def read_root():
    return {"msg": "Stock Monitor System Running 🚀"}