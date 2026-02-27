import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
# Default to Gmail if not specified, but flexible for Brevo/SendGrid
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com") 
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Frontend & Backend URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

def send_email_sync(to_email: str, subject: str, html_content: str):
    msg = EmailMessage()
    msg["From"] = f"Stock Watcher <{SENDER_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(html_content, subtype="html")

    try:
        # SSL Connection (Port 465)
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
                server.login(SMTP_LOGIN, SENDER_PASSWORD)
                server.send_message(msg)
        # TLS Connection (Port 587)
        else:
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

# 1. STOCK ALERT EMAIL
async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
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
                <p>&copy; 2026 Stock Watcher Inc. • Automated Alert System</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# 2. VERIFICATION EMAIL
async def send_verification_email(to_email: str, token: str):
    verify_link = f"{BACKEND_URL}/api/auth/verify-email?token={token}"
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
            .icon {{ font-size: 48px; margin-bottom: 20px; display: block; }}
            .btn {{ background-color: #0f172a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 25px; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content">
                <span class="icon">🛡️</span>
                <h2 style="margin-top: 0; color: #0f172a;">Verify your email</h2>
                <p style="line-height: 1.6;">Welcome to Stock Watcher! Please click the button below to verify your email address and activate your account.</p>
                
                <a href="{verify_link}" class="btn">Verify Account</a>
                
                <p style="margin-top: 30px; font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Stock Watcher Inc. • Security Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# 3. PASSWORD RESET OTP EMAIL
async def send_reset_otp_email(to_email: str, otp: str):
    subject = "Reset Your Password - StockWatcher 🔐"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 500px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #ef4444; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }}
            .content {{ padding: 40px; text-align: center; color: #334155; }}
            .otp-box {{ background-color: #fef2f2; border: 2px dashed #f87171; color: #dc2626; font-size: 32px; font-weight: 800; letter-spacing: 5px; padding: 15px; margin: 20px 0; border-radius: 8px; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>PASSWORD RESET</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px;">You requested to reset your password. Use the OTP below to proceed.</p>
                
                <div class="otp-box">{otp}</div>
                
                <p style="font-size: 14px; color: #64748b;">This code is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Stock Watcher Inc. • Security Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# 4. GENERIC / ANNOUNCEMENT EMAIL (✅ Updated to fix paragraph formatting)
def send_generic_email(to_email: str, subject: str, body: str):
    # Convert plain text newlines (\n) to HTML line breaks (<br>)
    formatted_body = body.replace('\n', '<br>')
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #4F46E5; padding: 25px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase; }}
            .content {{ padding: 40px 30px; color: #334155; line-height: 1.8; font-size: 16px; }}
            .announcement-badge {{ background-color: #EEF2FF; color: #4F46E5; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; display: inline-block; margin-bottom: 20px; }}
            .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Stock Watcher Update</h1>
            </div>
            <div class="content">
                <div class="announcement-badge">📢 Announcement</div>
                <p>{formatted_body}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 14px; color: #64748b; margin: 0;">
                    Thank you for being a valued member of our community.<br>
                    - The Stock Watcher Team
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Stock Watcher Inc. • Official Broadcast</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)
