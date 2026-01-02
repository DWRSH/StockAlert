from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ai_engine 
import logging

# Logger Setup
logger = logging.getLogger("StockWatcher")

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    if not ai_engine.model:
        raise HTTPException(status_code=503, detail="AI Service Unavailable")

    try:
        # ✅ UPDATED SYSTEM PROMPT (Supports US + India)
        system_instruction = """
        You are 'StockBot', a smart and friendly AI Financial Assistant for the StockWatcher App.
        
        Your Rules:
        1. You are an expert in BOTH **Indian Stock Market (NSE/BSE)** and **US Stock Market (NASDAQ/NYSE)**.
        2. Keep answers concise (under 3-4 sentences) unless asked for details.
        3. Use Emojis 📈 to make it engaging.
        4. Be aware of currency: Use '₹' for Indian stocks and '$' for US stocks.
        5. If asked about non-financial topics, politely refuse.
        6. Do NOT give direct financial advice (e.g., "Buy Apple now"). Instead say "Apple is showing bullish signs based on technicals...".
        """

        # Gemini Chat Session Start with Persona
        chat = ai_engine.model.start_chat(history=[
            {"role": "user", "parts": system_instruction},
            {"role": "model", "parts": "Understood. I am StockBot, ready to assist with insights on Indian and US Markets! 🚀"}
        ])
        
        response = chat.send_message(request.message)
        return {"reply": response.text}

    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="AI failed to respond.")
