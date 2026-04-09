# 📈 StockWatcher: Intelligent Stock Tracking & Portfolio Platform

![StockWatcher Banner](https://via.placeholder.com/1200x400/030712/06b6d4?text=StockWatcher+-+Master+the+Markets)

StockWatcher is a comprehensive, full-stack financial platform designed for proactive investors. It seamlessly integrates real-time exchange data (NSE, BSE, US Markets), RAG-powered AI financial assistance, advanced portfolio management, and an omnichannel alert system into one unified ecosystem.

---

## ✨ Core Features

* **⚡ Live Stock Tracking:** Zero-latency market data fetching using optimized `yfinance` API with custom stealth sessions to bypass cloud-blocking. Supports NSE, BSE, NASDAQ, and NYSE.
* **🤖 AI Financial Assistant (StockBot):** Powered by Google's Gemini API. The AI receives a real-time 30-day price history array and fundamental data to provide zero-hallucination, contextual market analysis.
* **💼 Portfolio Management:** Track your holdings, average buy prices, and quantities. Auto-calculates total invested value, current value, and real-time Profit & Loss (P&L).
* **🔔 Omnichannel Alert System:** Set specific price targets ("Breakouts" or "Buy Dips"). Background schedulers dispatch zero-lag notifications directly to your **Email** and **Telegram**.
* **📰 Live News Integration:** Aggregates real-time financial news, corporate earnings, and global market updates relevant to your watchlist using RSS feeds.
* **🛡️ Secure Auth System:** Enterprise-grade JWT (JSON Web Tokens) authentication and encrypted session management using `bcrypt`.
* **🌐 Multi-Market Support:** Handles both Indian Equities (₹) and US Stocks ($) with automatic currency context formatting.

---

## 🛠️ Tech Stack

**Backend Architecture:**
* **Framework:** FastAPI (Python) - High performance, asynchronous framework.
* **Database:** MongoDB Atlas
* **ODM / Driver:** Beanie (v1.26.0) & Motor (v3.4.0) - Natively asynchronous MongoDB modeling.
* **AI Integration:** `google-generativeai` (Gemini Pro/Flash Models)
* **Data Providers:** `yfinance`, `beautifulsoup4`, `feedparser`
* **Task Scheduling:** `apscheduler` (For background price checks and alerts)
* **Security:** `passlib`, `python-jose`, `slowapi` (Rate Limiting)

**Deployment:**
* **Backend Hosting:** Render
* **Mobile App:** Android APK (Available via GitHub Releases)

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up the project locally on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/StockWatcher.git](https://github.com/yourusername/StockWatcher.git)
cd StockWatcher/backend

2. Create a Virtual Environment & Install Dependencies
Ensure you are using Python 3.10+.

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

3. Environment Variables setup
Create a .env file in the root of your backend directory and add the following keys:

# Database
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/stockwatcher

# Security
JWT_SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Alerts
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

4. Run the Server

uvicorn app.main:app --host 0.0.0.0 --port 10000 --reload

The API will be available at http://localhost:10000.
