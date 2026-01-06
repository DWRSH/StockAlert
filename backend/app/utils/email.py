import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587)) # Port 587 is safer usually
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Frontend URL (Redirect ke liye Auth.py me use hota hai, yahan reference ke liye)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ✅ BACKEND URL (Render Link)
# Example: https://sabackend-e73v.onrender.com
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

def send_email_sync(to_email: str, subject: str, html_content: str):
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
        print(f"❌ Failed to send email via {SMTP_SERVER}")
        print(f"❌ Error Details: {e}")
        return False

# --- ASYNC WRAPPERS ---

async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
    currency_symbol = "₹" if symbol.endswith((".NS", ".BO")) else "$"
    subject = f"🚀 Alert Triggered: {symbol} is now {currency_symbol}{current_price}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f3f4f6; }}
            .email-container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }}
            .header {{ background-color: #1e293b; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 20px; text-align: center; }}
            .btn {{ background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header"><h1>STOCK WATCHER ALERT</h1></div>
            <div class="content">
                <h2>{symbol} Hit Target!</h2>
                <p>Target: {currency_symbol}{target_price} | Current: {currency_symbol}{current_price}</p>
                <br>
                <a href="{FRONTEND_URL}" class="btn">Check Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ✅ FIXED VERIFICATION FUNCTION
async def send_verification_email(to_email: str, token: str):
    
    # 1. Correct Link Creation
    # Path '/api/auth/verify-email' hona chahiye, na ki sirf '/verify-email'
    # Kyunki aapne router ko prefix='/api/auth' ke sath include kiya hai.
    
    verify_link = f"{BACKEND_URL}/api/auth/verify-email?token={token}"
    
    print(f"🔗 Verification Link Generated: {verify_link}")
    
    subject = "Action Required: Verify your Account 🔐"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 500px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #1e293b; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; }}
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
                <h2>Verify your email</h2>
                <p>Click the button below to activate your account.</p>
                
                <a href="{verify_link}" class="btn">Verify Account</a>
                
                <p style="margin-top: 20px; font-size: 12px; color: #888;">Link: {verify_link}</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

def send_generic_email(to_email: str, subject: str, body: str):
    html_content = f"<p>{body}</p>"
    return send_email_sync(to_email, subject, html_content)
