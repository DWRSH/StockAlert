import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Frontend & Backend URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

# --- SHARED STYLES (Professional Look) ---
EMAIL_STYLE = """
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; background-color: #f4f7f6; padding: 40px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }
    .content { padding: 40px 30px; color: #334155; text-align: center; }
    .content h2 { margin-top: 0; color: #1e293b; font-size: 22px; }
    .content p { line-height: 1.6; font-size: 16px; color: #475569; margin-bottom: 25px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
    .btn:hover { background-color: #1d4ed8; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; }
    .info-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; }
    .info-label { font-weight: bold; color: #64748b; text-align: left; }
    .info-value { font-weight: bold; color: #0f172a; text-align: right; font-size: 18px; }
    .icon-shield { font-size: 48px; margin-bottom: 15px; display: block; }
</style>
"""

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
    subject = f"🔔 Price Alert: {symbol} reached {currency_symbol}{current_price}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>{EMAIL_STYLE}</head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="header">
                    <h1>Stock Watcher</h1>
                </div>
                <div class="content">
                    <h2>Target Price Hit! 🎯</h2>
                    <p>Good news! <strong>{symbol}</strong> has reached your target price.</p>
                    
                    <table class="info-table">
                        <tr>
                            <td class="info-label">Stock Symbol</td>
                            <td class="info-value">{symbol}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Target Price</td>
                            <td class="info-value">{currency_symbol}{target_price}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Current Price</td>
                            <td class="info-value" style="color: #16a34a;">{currency_symbol}{current_price}</td>
                        </tr>
                    </table>

                    <p>Log in to your dashboard to take action.</p>
                    <a href="{FRONTEND_URL}" class="btn">View Portfolio</a>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Stock Watcher Inc. • Automated Alert System</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ✅ VERIFICATION EMAIL (Shield in Body, Lock in Subject)
async def send_verification_email(to_email: str, token: str):
    verify_link = f"{BACKEND_URL}/api/auth/verify-email?token={token}"
    print(f"🔗 Verification Link Generated: {verify_link}")
    
    # 1. Subject me wahi purana Key & Lock 🔐
    subject = "Action Required: Verify your Account 🔐"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>{EMAIL_STYLE}</head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="header">
                    <h1>Stock Watcher</h1>
                </div>
                <div class="content">
                    
                    <div class="icon-shield">🛡️</div>
                    
                    <h2>Secure your Account</h2>
                    <p>Welcome! To insure the security of your Stock Watcher account, please verify your email address.</p>
                    <p>Click the button below to activate your account:</p>
                    
                    <div style="margin: 30px 0;">
                        <a href="{verify_link}" class="btn">Verify Account</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #94a3b8; margin-top: 30px;">
                        If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Stock Watcher Inc. • Secure Verification</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

def send_generic_email(to_email: str, subject: str, body: str):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>{EMAIL_STYLE}</head>
    <body>
        <div class="email-wrapper">
            <div class="email-container">
                <div class="header">
                    <h1>Announcement</h1>
                </div>
                <div class="content">
                    <p>{body}</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Stock Watcher Inc.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)
