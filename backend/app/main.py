from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

# Local Imports
from app.core.config import settings
from app.db.database import init_db
# Safe imports for routers
from app.routers import auth, stocks, alerts, chat, portfolio, admin, users
from app.services.background import track_stock_prices

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StockWatcher")

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Server Starting...")
    await init_db()
    
    # Scheduler Logic
    if not scheduler.running:
        scheduler.add_job(track_stock_prices, 'interval', seconds=60)
        scheduler.start()
        logger.info("✅ Background Scheduler Started")
    
    yield
    
    logger.info("🛑 Server Shutting Down...")

app = FastAPI(lifespan=lifespan, title="Stock Alert System")

# ==========================
# 🔒 CORS SETTINGS
# ==========================
origins = [
    "http://localhost:5173",            # Local Dev
    "http://127.0.0.1:5173",            # Local Dev IP
    "https://safrontend.onrender.com",  # Production Frontend
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
# 🛣️ REGISTER ROUTERS (✅ ALL FIXED WITH PREFIXES)
# ==========================

# 1. Auth -> Frontend calls /api/auth/getuser
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# 2. Stocks -> Frontend calls /api/indices, /api/search-stock
app.include_router(stocks.router, prefix="/api", tags=["Stocks"])

# 3. Alerts -> Frontend calls /api/alerts
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])

# 4. AI Chat -> Frontend calls /api/chat...
app.include_router(chat.router, prefix="/api", tags=["AI Chat"])

# 5. Portfolio -> Frontend calls /api/portfolio...
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio"])

# 6. Admin -> Frontend calls /api/admin...
app.include_router(admin.router, prefix="/api", tags=["Admin"])

# 7. Users -> Frontend calls /api/users/update-telegram
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Stock Monitor System is Running Successfully 🚀",
        "docs_url": "http://localhost:8000/docs"
    }
