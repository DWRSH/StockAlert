# File: app/services/background.py

import asyncio
import logging
from app.models.alert import Alert
from app.services.finance import get_live_price
from app.utils.email import send_email_notification

logger = logging.getLogger("StockWatcher")

async def track_stock_prices():
    try:
        # 1. Active alerts dhoondo
        active_alerts = await Alert.find(Alert.status == "active").to_list()
        if not active_alerts:
            return

        # 2. Optimization: Duplicate symbols ko group karo taaki baar-baar fetch na karna pade
        symbol_map = {}
        for alert in active_alerts:
            sym = alert.stock_symbol
            if sym not in symbol_map: symbol_map[sym] = []
            symbol_map[sym].append(alert)

        unique_symbols = list(symbol_map.keys())
        
        # 3. Har unique symbol ka price check karo
        for symbol in unique_symbols:
            try:
                current_price = get_live_price(symbol)
                if current_price is None: continue
                
                # 4. Check karo ki target hit hua ya nahi
                for alert in symbol_map[symbol]:
                    # Agar current price target se zyada ya barabar hai
                    if current_price >= alert.target_price:
                        print(f"🎯 ALERT TRIGGERED: {symbol} at {current_price}")
                        
                        # Email Bhejo
                        email_sent = await send_email_notification(
                            to_email=alert.email, 
                            symbol=alert.stock_symbol, 
                            current_price=current_price,
                            target_price=alert.target_price
                        )
                        
                        # Agar email chala gaya, to alert ko "triggered" mark karo
                        if email_sent:
                            alert.status = "triggered"
                            await alert.save()
                
                # API Rate limit se bachne ke liye thoda sleep
                await asyncio.sleep(1) 
            except Exception as e:
                logger.error(f"Error checking {symbol}: {e}")
                
    except Exception as e:
        logger.error(f"Background Task Error: {e}")