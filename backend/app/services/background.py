# File: app/services/background.py

import asyncio
import logging
from app.models.alert import Alert
from app.services.finance import get_live_price
from app.utils.email import send_email_notification

# Logger Setup (Verbose Mode)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StockWatcher")

async def track_stock_prices():
    try:
        # 1. Active alerts dhoondo
        active_alerts = await Alert.find(Alert.status == "active").to_list()
        
        if not active_alerts:
            # Logs bhare nahi, isliye return silently agar alerts nahi hain
            return

        logger.info(f"📋 Checking {len(active_alerts)} active alerts...")

        # 2. Optimization: Duplicate symbols ko group karo
        symbol_map = {}
        for alert in active_alerts:
            sym = alert.stock_symbol
            if sym not in symbol_map: symbol_map[sym] = []
            symbol_map[sym].append(alert)

        unique_symbols = list(symbol_map.keys())
        
        # 3. Har unique symbol ka price check karo
        for symbol in unique_symbols:
            try:
                # ✅ FIX: 'await' lagana zaroori hai kyunki get_live_price async hai
                current_price = await get_live_price(symbol)
                
                # Debug Log: Price kya aaya?
                if current_price is None:
                    logger.warning(f"⚠️ Could not fetch price for {symbol}. Skipping...")
                    continue
                
                logger.info(f"🔎 {symbol} Live Price: ₹{current_price}")

                # 4. Target Check karo
                for alert in symbol_map[symbol]:
                    target = float(alert.target_price) # Float conversion safety
                    
                    # Logic Check
                    # logger.info(f"   👉 Checking Alert: Target ₹{target} vs Current ₹{current_price}")

                    if current_price >= target:
                        logger.info(f"   🎯 TARGET HIT! {symbol} (₹{current_price}) >= Target (₹{target})")
                        logger.info(f"   🚀 Sending email to {alert.email}...")
                        
                        # Email Bhejo
                        email_sent = await send_email_notification(
                            to_email=alert.email, 
                            symbol=alert.stock_symbol, 
                            current_price=current_price,
                            target_price=target
                        )
                        
                        if email_sent:
                            logger.info("   ✅ Email Sent Successfully!")
                            alert.status = "triggered"
                            await alert.save()
                        else:
                            logger.error("   ❌ Email Sending Failed (Check SMTP Config).")
                
                # Rate limit safety
                await asyncio.sleep(0.5) 
            except Exception as e:
                logger.error(f"Error checking {symbol}: {e}")
                
    except Exception as e:
        logger.error(f"Background Task Error: {e}")
