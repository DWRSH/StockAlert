import asyncio
import logging
from datetime import datetime
from app.models.alert import Alert

# ✅ Correct Imports
from app.services.finance import get_live_price 
from app.utils.email import send_email_notification 
from app.services.notifier import send_telegram_notification 

logger = logging.getLogger("StockWatcher")

async def track_stock_prices():
    """
    Background task to monitor active stock alerts and trigger notifications for BOTH UP and DOWN trends.
    """
    try:
        # 1. Fetch all active alerts
        active_alerts = await Alert.find(Alert.status == "active").to_list()
        
        if not active_alerts:
            return

        # 2. Group by symbol
        symbol_map = {}
        for alert in active_alerts:
            sym = alert.stock_symbol 
            if sym not in symbol_map:
                symbol_map[sym] = []
            symbol_map[sym].append(alert)

        # 3. Process each symbol
        for symbol, alerts in symbol_map.items():
            try:
                current_price = await get_live_price(symbol)
                
                if current_price is None:
                    continue

                for alert in alerts:
                    target = float(alert.target_price)
                    # ✅ Default direction to UP if old alerts don't have it
                    direction = getattr(alert, 'direction', 'UP') 
                    
                    # ✅ FIX: Handle both UP and DOWN logic
                    is_triggered = False
                    
                    if direction == "UP" and current_price >= target:
                        is_triggered = True
                        logger.info(f"🚀 UP Target Hit: {symbol} reached {current_price}")
                        
                    elif direction == "DOWN" and current_price <= target:
                        is_triggered = True
                        logger.info(f"📉 DOWN Target Hit: {symbol} dropped to {current_price}")

                    # If either condition is met, send alerts
                    if is_triggered:
                        tasks = []
                        
                        # --- Email Task ---
                        if alert.email:
                            tasks.append(send_email_notification(
                                to_email=alert.email,
                                symbol=symbol,
                                current_price=current_price,
                                target_price=target
                            ))

                        # --- Telegram Task ---
                        if getattr(alert, 'telegram_id', None):
                            logger.info(f"📨 Sending Telegram to {alert.telegram_id}")
                            tasks.append(send_telegram_notification(
                                chat_id=alert.telegram_id,
                                symbol=symbol,
                                target=target,
                                current=current_price
                            ))

                        if tasks:
                            await asyncio.gather(*tasks)

                        # Update Status
                        alert.status = "triggered"
                        alert.triggered_at = datetime.utcnow()
                        await alert.save()
                        
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Error processing symbol {symbol}: {e}")

    except Exception as e:
        logger.error(f"Global Background Task Error: {e}")
