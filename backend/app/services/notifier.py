import os
import smtplib
import httpx
import logging
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# Logger setup
logger = logging.getLogger("Notifier")

# --- CONFIGURATION ---
# Email Config
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Frontend URL (Used in links)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Telegram Config (Matches your .env name)
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

# ============================================================
# 📧 EMAIL SECTION
# ============================================================

def send_email_sync(to_email: str, subject: str, html_content: str):
    """
    Synchronous function to send email via SMTP.
    Used by async wrappers below.
    """
    msg = EmailMessage()
    msg["From"] = f"Stock Watcher <{SENDER_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(html_content, subtype="html")

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_LOGIN, SENDER_PASSWORD)
            server.send_message(msg)
            
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

# 1. Price Alert Email (With Currency Logic)
async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
    
    # ✅ Logic: Determine Currency Symbol
    currency_symbol = "₹" if symbol.endswith((".NS", ".BO")) else "$"

    subject = f"🚀 Alert Triggered: {symbol} is now {currency_symbol}{current_price}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #1e293b; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }}
            .content {{ padding: 30px; text-align: center; color: #334155; }}
            .stock-badge {{ background-color: #eff6ff; color: #1d4ed8; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 20px; }}
            .price-table {{ width: 100%; margin-top: 20px; border-collapse: collapse; }}
            .price-cell {{ padding: 15px; border: 1px solid #e2e8f0; width: 50%; }}
            .price-label {{ font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.5px; }}
            .price-value {{ font-size: 24px; font-weight: 800; margin-top: 5px; color: #0f172a; }}
            .price-green {{ color: #16a34a; }}
            .btn {{ background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 30px; }}
            .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content">
                <div class="stock-badge">{symbol}</div>
                <h2 style="margin: 0 0 10px 0; color: #0f172a;">Target Price Hit! 🎯</h2>
                <p style="margin: 0; line-height: 1.5;">The stock you are tracking has reached your specified limit.</p>
                
                <table class="price-table">
                    <tr>
                        <td class="price-cell">
                            <div class="price-label">Your Target</div>
                            <div class="price-value">{currency_symbol}{target_price}</div>
                        </td>
                        <td class="price-cell" style="background-color: #f0fdf4;">
                            <div class="price-label">Current Price</div>
                            <div class="price-value price-green">{currency_symbol}{current_price}</div>
                        </td>
                    </tr>
                </table>

                <a href="{FRONTEND_URL}" class="btn">View Dashboard</a>
            </div>
            <div class="footer">
                <p>&copy; 2025 Stock Watcher Inc. • Automated Alert System</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# 2. Verification Email
async def send_verification_email(to_email: str, token: str):
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    verify_link = f"{backend_url}/verify-email?token={token}"
    
    subject = "Action Required: Verify your Account 🔐"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 500px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #1e293b; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }}
            .content {{ padding: 40px; text-align: center; color: #334155; }}
            .btn {{ background-color: #0f172a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 25px; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content">
                <h2 style="margin-top: 0; color: #0f172a;">Verify your email</h2>
                <p>Please click the button below to verify your email address.</p>
                <a href="{verify_link}" class="btn">Verify Account</a>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# 3. Broadcast / Admin Email
def send_generic_email(to_email: str, subject: str, body: str):
    """
    Admin Announcements function (Sync for BackgroundTasks)
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: #4F46E5; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }}
            .content {{ padding: 30px; color: #334155; line-height: 1.6; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>📢 ANNOUNCEMENT</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px; margin-top: 0;">Hello,</p>
                <p style="font-size: 16px;">{body}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 14px; color: #64748b;">Best regards,<br>The Stock Watcher Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)


# ============================================================
# 📱 TELEGRAM SECTION (✅ Updated & Fixed)
# ============================================================

async def send_telegram_notification(chat_id: str, symbol: str, target: float, current: float):
    """
    Sends a formatted Telegram message.
    Handles 'Localhost' link issues automatically.
    """
    if not TELEGRAM_TOKEN:
        logger.error("❌ Telegram Token is missing! Check .env file.")
        return False
        
    if not chat_id:
        logger.error("❌ Chat ID is missing.")
        return False

    # 1. Currency & Market Logic
    if symbol.endswith((".NS", ".BO")):
        currency_symbol = "₹"
        market_name = "Indian Market 🇮🇳"
    else:
        currency_symbol = "$"
        market_name = "US Market 🇺🇸"

    # 2. Base Message
    message = (
        f"🔔 <b>TARGET HIT: {symbol}</b>\n\n"
        f"🚀 <b>Price Alert Triggered</b>\n"
        f"The stock has reached your target price.\n\n"
        f"💵 <b>Current Price:</b> <code>{currency_symbol}{current}</code>\n"
        f"🎯 <b>Target Price:</b>  <code>{currency_symbol}{target}</code>\n\n"
        f"📊 <i>Market: {market_name}</i>"
    )

    # 3. Smart URL Handling (Localhost Fix)
    payload = {
        "chat_id": chat_id,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    # ✅ Logic: Check if Frontend is Localhost or Live
    # Telegram API rejects buttons with 'localhost' URLs.
    if "localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL:
        # Append Link to Text (Works on Localhost)
        message += f"\n\n🔗 <a href='{FRONTEND_URL}'>Open Dashboard</a>"
        payload["text"] = message
    else:
        # Use Pro Button (Works on Live URL)
        payload["text"] = message
        payload["reply_markup"] = {
            "inline_keyboard": [
                [
                    {
                        "text": "📈 View Chart & Dashboard",
                        "url": FRONTEND_URL
                    }
                ]
            ]
        }

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

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
