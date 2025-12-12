# File: app/routers/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import ai_engine 
import logging

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    if not ai_engine.model:
        raise HTTPException(status_code=503, detail="AI Service Unavailable")

    try:
        # System Prompt (Personality Set karna)
        system_instruction = """
        You are 'StockBot', a smart and friendly AI Financial Assistant for the StockWatcher App.
        
        Your Rules:
        1. Answer queries related to Indian Stock Market, Investing, and Trading terms.
        2. Keep answers concise (under 3-4 sentences) unless asked for details.
        3. Use Emojis 📈 to make it engaging.
        4. If asked about non-financial topics, politely refuse.
        5. Do NOT give direct financial advice (e.g., "Buy Tata Motors now"). Instead say "Tata Motors is showing bullish signs based on technicals...".
        """

        # Gemini Chat Session Start
        chat = ai_engine.model.start_chat(history=[
            {"role": "user", "parts": system_instruction},
            {"role": "model", "parts": "Understood. I am StockBot, ready to assist with market insights! 🚀"}
        ])
        
        response = chat.send_message(request.message)
        return {"reply": response.text}

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="AI failed to respond")
