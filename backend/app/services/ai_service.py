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
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name)
            except Exception as e:
                logger.warning(f"⚠️ Could not list models: {e}")

            # Priority List
            priority_list = [
                "models/gemini-1.5-flash",
                "models/gemini-1.5-flash-latest",
                "models/gemini-pro",
                "models/gemini-1.0-pro"
            ]

            selected_model = next((t for t in priority_list if t in available_models), None)
            if not selected_model:
                selected_model = available_models[0] if available_models else "models/gemini-pro"

            self.model_name = selected_model
            self.model = genai.GenerativeModel(selected_model)
            logger.info(f"✅ AI READY: Connected to '{self.model_name}'")

        except Exception as e:
            logger.error(f"❌ AI Config Error: {e}")

    def analyze(self, symbol, price, change, source, currency="INR"):
        if not self.model:
            self.configure()
            if not self.model:
                return "AI Unavailable: Check API Key or Server Logs."

        try:
            # DYNAMIC CONTEXT SETTING
            is_us = currency == "USD"
            market_context = "US Stock Market (NASDAQ/NYSE)" if is_us else "Indian Stock Market (NSE/BSE)"
            currency_symbol = "$" if is_us else "₹"

            # 🛠️ IMPROVED PROMPT
            prompt = f"""
            You are a Senior Financial Analyst for the {market_context}.
            Analyze the following stock data based on technical price action and your knowledge of the company's fundamentals.

            📊 **Stock Data:**
            - Symbol: {symbol}
            - Current Price: {currency_symbol}{price} (Source: {source})
            - Currency: {currency}
            - 1 Month Return: {change}

            📝 **Instructions:**
            1. Consider the 1-month return to determine short-term momentum.
            2. Combine this with your internal knowledge about the company's sector.
            3. Keep the tone professional, concise, and actionable.
            4. STRICT RULE: Start your 'Analysis' section by explicitly stating the exact 1-month return value you received in the data above.

            📋 **Response Format (Strictly follow this structure):**
            
            📈 **Trend:** [Bullish / Bearish / Sideways / Volatile]
            
            💡 **Analysis:** [Explicitly state the 1-month return here first. Then provide 2-3 sentences explaining WHY.]
            
            🎯 **Strategy:** [Accumulate on Dips / Hold for Long Term / Book Profits / Avoid]
            
            ⚠️ **Risk Factor:** [Low / Medium / High] - [One short reason]
            """
            
            # 🚀 DEBUGGING TRACKERS
            logger.info(f"🔍 DEBUG AI INPUT -> Symbol: {symbol} | Price: {price} | 1-Mo Return: '{change}'")
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"AI Generation Failed: {e}")
            return "AI Analysis temporarily unavailable."

# Singleton Instance
ai_engine = AIService()
