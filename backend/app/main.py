# File: app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

# Local Imports
from app.core.config import settings
from app.db.database import init_db
# ✅ Added 'admin' to imports
from app.routers import auth, stocks, alerts, chat, portfolio, admin
from app.services.background import track_stock_prices

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StockWatcher")

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Server Starting...")
    await init_db()
    
    # Scheduler Logic (Background jobs for Alerts)
    if not scheduler.running:
        scheduler.add_job(track_stock_prices, 'interval', seconds=60)
        scheduler.start()
    
    yield
    
    logger.info("🛑 Server Shutting Down...")

app = FastAPI(lifespan=lifespan, title="Stock Alert System")

# ==========================
# 🔒 CORS SETTINGS (FIXED)
# ==========================
origins = [
    "http://localhost:5173",            # Local Dev
    "http://127.0.0.1:5173",            # Local Dev IP
    "https://safrontend.onrender.com",  # 👈 LIVE FRONTEND
    "https://safrontend.onrender.com/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# 🛣️ REGISTER ROUTERS
# ==========================
app.include_router(auth.router, tags=["Auth"])
app.include_router(stocks.router, tags=["Stocks"])
app.include_router(alerts.router, tags=["Alerts"])
app.include_router(chat.router, tags=["AI Chat"])
app.include_router(portfolio.router, tags=["Portfolio"])
app.include_router(admin.router, tags=["Admin"]) # 👈 NEW: Admin Router Added

@app.get("/")
def read_root():
    return {"msg": "Stock Monitor System Running 🚀"}
