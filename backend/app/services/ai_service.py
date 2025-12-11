# File: app/services/ai_service.py

import google.generativeai as genai
import logging
from app.core.config import settings

logger = logging.getLogger("StockWatcher")

class AIService:
    def __init__(self):
        self.model = None
        self.model_name = "Unknown"
        self.configure()

    def configure(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("⚠️ GEMINI_API_KEY missing in .env")
            return

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # --- SMART MODEL SELECTOR LOGIC ---
            logger.info("🤖 AI: Searching for available models...")
            available_models = []
            
            try:
                # Google se pucho ki kon se models available hain
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name)
            except Exception as e:
                logger.warning(f"⚠️ Could not list models: {e}")

            # Priority List (Latest & Fastest first)
            priority_list = [
                "models/gemini-1.5-flash",
                "models/gemini-1.5-flash-latest",
                "models/gemini-pro",
                "models/gemini-1.0-pro"
            ]

            selected_model = None
            
            # Match Priority List with Available Models
            for target in priority_list:
                if target in available_models:
                    selected_model = target
                    break
            
            # Fallback
            if not selected_model:
                if available_models:
                    selected_model = available_models[0]
                else:
                    selected_model = "models/gemini-pro"

            self.model_name = selected_model
            self.model = genai.GenerativeModel(selected_model)
            logger.info(f"✅ AI READY: Connected to '{self.model_name}'")

        except Exception as e:
            logger.error(f"❌ AI Config Error: {e}")

    def analyze(self, symbol, price, change, source):
        if not self.model:
            self.configure()
            if not self.model:
                return "AI Unavailable: Check API Key or Server Logs."

        try:
            # --- IMPROVED PROFESSIONAL PROMPT ---
            prompt = f"""
            You are a Senior Financial Analyst for the Indian Stock Market.
            Analyze the following stock data based on technical price action and your knowledge of the company's fundamentals.

            📊 **Stock Data:**
            - Symbol: {symbol}
            - Current Price: ₹{price} (Source: {source})
            - 1 Month Return: {change}%

            📝 **Instructions:**
            1. Consider the 1-month return to determine short-term momentum.
            2. Combine this with your internal knowledge about the company's sector (e.g., IT, Banking, Energy).
            3. Keep the tone professional, concise, and actionable.

            📋 **Response Format (Strictly follow this structure):**
            
            📈 **Trend:** [Bullish / Bearish / Sideways / Volatile]
            
            💡 **Analysis:** [Provide 2-3 sentences explaining WHY. Mention if the stock is overbought, oversold, or reacting to sector news.]
            
            🎯 **Strategy:** [Accumulate on Dips / Hold for Long Term / Book Profits / Avoid]
            
            ⚠️ **Risk Factor:** [Low / Medium / High] - [One short reason, e.g., "High Valuation" or "Market Volatility"]
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"AI Generation Failed: {e}")
            return "AI Analysis temporarily unavailable."

# Singleton Instance
ai_engine = AIService()