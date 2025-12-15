import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 2525))
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# --- SHARED CSS STYLES (To keep consistency) ---
# Ye variables hum niche f-strings me use karenge taaki code clean rahe
STYLE_BODY = "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;"
STYLE_CONTAINER = "max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"
STYLE_HEADER = "background-color: #4F46E5; padding: 30px; text-align: center;" # ✅ UNIFIED BRAND COLOR
STYLE_HEADER_H1 = "color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;"
STYLE_CONTENT = "padding: 40px 30px; color: #334155; line-height: 1.6;"
STYLE_BTN = "display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 25px;"
STYLE_FOOTER = "background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;"

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
        print(f"❌ Failed to send email via {SMTP_SERVER}: {e}")
        return False

# ==========================================
# 1. STOCK ALERT EMAIL (Consistent Look)
# ==========================================
async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
    subject = f"🚀 Target Hit: {symbol} is ₹{current_price}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>body {{ {STYLE_BODY} }}</style></head>
    <body>
        <div style="{STYLE_CONTAINER}">
            <div style="{STYLE_HEADER}">
                <h1 style="{STYLE_HEADER_H1}">STOCK WATCHER</h1>
            </div>
            <div style="{STYLE_CONTENT}; text-align: center;">
                <div style="background-color: #eff6ff; color: #4F46E5; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 20px;">
                    {symbol}
                </div>
                <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 22px;">Target Price Hit! 🎯</h2>
                <p style="margin: 0;">Your stock has reached the specified limit.</p>
                
                <div style="margin-top: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 15px; border-right: 1px solid #e2e8f0; width: 50%;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Target</div>
                                <div style="font-size: 20px; font-weight: 800; color: #0f172a;">₹{target_price}</div>
                            </td>
                            <td style="padding: 15px; background-color: #f0fdf4; width: 50%;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #16a34a; font-weight: bold;">Current</div>
                                <div style="font-size: 20px; font-weight: 800; color: #16a34a;">₹{current_price}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <a href="{FRONTEND_URL}" style="{STYLE_BTN}">View Dashboard</a>
            </div>
            <div style="{STYLE_FOOTER}">
                <p style="margin: 0;">&copy; 2025 Stock Watcher. Automated Alert System.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ==========================================
# 2. VERIFICATION EMAIL (Consistent Look)
# ==========================================
async def send_verification_email(to_email: str, token: str):
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    verify_link = f"{backend_url}/verify-email?token={token}"
    
    subject = "Verify your Account 🔐"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>body {{ {STYLE_BODY} }}</style></head>
    <body>
        <div style="{STYLE_CONTAINER}">
            <div style="{STYLE_HEADER}">
                <h1 style="{STYLE_HEADER_H1}">STOCK WATCHER</h1>
            </div>
            <div style="{STYLE_CONTENT}; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🛡️</div>
                <h2 style="margin-top: 0; color: #0f172a; font-size: 22px;">Verify your email</h2>
                <p>Welcome to Stock Watcher! Please click the button below to verify your email address and activate your account.</p>
                
                <a href="{verify_link}" style="{STYLE_BTN}">Verify Account</a>
                
                <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Link expires in 24 hours.</p>
            </div>
            <div style="{STYLE_FOOTER}">
                <p style="margin: 0;">&copy; 2025 Stock Watcher. Security Team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ==========================================
# 3. BROADCAST EMAIL (Consistent Look)
# ==========================================
def send_generic_email(to_email: str, subject: str, body: str):
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>body {{ {STYLE_BODY} }}</style></head>
    <body>
        <div style="{STYLE_CONTAINER}">
            <div style="{STYLE_HEADER}">
                <h1 style="{STYLE_HEADER_H1}">STOCK WATCHER</h1>
            </div>
            <div style="{STYLE_CONTENT}">
                <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">📢 Announcement</h2>
                <div style="font-size: 16px; color: #334155; line-height: 1.6;">
                    {body}
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,<br>The Stock Watcher Team</p>
            </div>
            <div style="{STYLE_FOOTER}">
                <p style="margin: 0;">&copy; 2025 Stock Watcher. Admin Broadcast.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)
