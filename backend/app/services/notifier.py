import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("Notifier")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

async def send_telegram_notification(chat_id: str, symbol: str, target: float, current: float):
    """
    Sends a formatted Telegram message to a specific chat_id.
    """
    if not TELEGRAM_TOKEN or not chat_id:
        logger.error(f"Telegram configuration missing for chat_id: {chat_id}")
        return False

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        
        message = (
            f"🔔 **STOCK ALERT TRIGGERED**\n\n"
            f"📈 **Stock:** {symbol}\n"
            f"🎯 **Target Price:** ₹{target}\n"
            f"💰 **Current Price:** ₹{current}\n\n"
            f"✅ Your target has been reached!"
        )

        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                logger.info(f"Telegram notification sent to {chat_id} for {symbol}")
                return True
            else:
                logger.error(f"Telegram API Error: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Exception while sending Telegram notification: {e}")
        return False
