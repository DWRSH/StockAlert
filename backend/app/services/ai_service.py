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
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            priority_list = ["models/gemini-1.5-flash", "models/gemini-1.5-flash-latest", "models/gemini-pro"]
            selected_model = next((t for t in priority_list if t in available_models), available_models[0] if available_models else "models/gemini-pro")
            
            self.model_name = selected_model
            self.model = genai.GenerativeModel(selected_model)
            logger.info(f"✅ AI READY: Connected to '{self.model_name}'")
        except Exception as e:
            logger.error(f"❌ AI Config Error: {e}")

    # ✅ ACCEPTING PRICE_HISTORY INSTEAD OF CHANGE
    def analyze(self, symbol, current_price, price_history, source, currency="INR"):
        if not self.model:
            self.configure()
            if not self.model: return "AI Unavailable: Check API Key or Server Logs."

        try:
            is_us = currency == "USD"
            market_context = "US Stock Market (NASDAQ/NYSE)" if is_us else "Indian Stock Market (NSE/BSE)"
            currency_symbol = "$" if is_us else "₹"

            # Formulate the string for AI
            if not price_history:
                history_str = "Data Not Available"
            else:
                history_str = ", ".join(map(str, price_history))

            # 🛠️ NEW PROMPT FOR ARRAY ANALYSIS
            prompt = f"""
            You are a Senior Financial Analyst for the {market_context}.
            Analyze the stock based on its recent 30-day price trend and your internal knowledge of the company.

            📊 **Stock Data:**
            - Symbol: {symbol}
            - Current Price: {currency_symbol}{current_price}
            - Last 30 Trading Days Prices (Oldest to Newest): [{history_str}]

            📝 **Instructions:**
            1. Look at the array of the last 30 days' prices. Identify if the trend is making higher highs (Bullish), lower lows (Bearish), or staying flat (Sideways).
            2. Combine this price action with fundamental knowledge of the sector.
            3. STRICT RULE: Begin your 'Analysis' by explicitly stating the price trend you observed from the array (e.g., "The stock moved from X to Y over the last 30 days...").

            📋 **Response Format:**
            
            📈 **Trend:** [Bullish / Bearish / Sideways / Volatile]
            
            💡 **Analysis:** [State the price movement from the array first. Then give 2-3 sentences explaining why.]
            
            🎯 **Strategy:** [Accumulate on Dips / Hold for Long Term / Book Profits / Avoid]
            
            ⚠️ **Risk Factor:** [Low / Medium / High] - [One short reason]
            """
            
            logger.info(f"🔍 DEBUG AI INPUT -> Symbol: {symbol} | Current: {current_price} | History Length: {len(price_history)}")
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"AI Generation Failed: {e}")
            return "AI Analysis temporarily unavailable."

ai_engine = AIService()
