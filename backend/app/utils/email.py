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
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Common CSS Styles for Consistency
COMMON_STYLE = """
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background-color: #1e293b; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 800; }
    .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .btn:hover { background-color: #1d4ed8; }
    .footer { background-color: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .highlight { color: #0f172a; font-weight: 700; }
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
        print(f"❌ Failed to send email: {e}")
        return False

# ==========================================
# 1. 🚀 PRICE ALERT EMAIL
# ==========================================
async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
    subject = f"🔔 Alert: {symbol} hit ₹{current_price}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>{COMMON_STYLE}
        .price-card {{ background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
        .price-label {{ font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }}
        .price-value {{ font-size: 28px; font-weight: 800; color: #16a34a; margin: 5px 0; }}
        .stock-tag {{ background: #1e293b; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; vertical-align: middle; }}
    </style></head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content">
                <h2 style="margin-top: 0; color: #0f172a;">Target Price Hit! 🎯</h2>
                <p>Your tracking alert for <span class="stock-tag">{symbol}</span> has been triggered.</p>
                
                <div class="price-card">
                    <div class="price-label">Current Market Price</div>
                    <div class="price-value">₹{current_price}</div>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b;">Target was: <span style="text-decoration: line-through;">₹{target_price}</span></p>
                </div>

                <div style="text-align: center;">
                    <a href="{FRONTEND_URL}/dashboard" class="btn">View Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Stock Watcher Inc. • Smart Alerts System</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ==========================================
# 2. 🔐 VERIFICATION EMAIL
# ==========================================
async def send_verification_email(to_email: str, token: str):
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    verify_link = f"{backend_url}/verify-email?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>{COMMON_STYLE}
        .icon-box {{ font-size: 48px; text-align: center; margin-bottom: 10px; }}
    </style></head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content" style="text-align: center;">
                <div class="icon-box">🛡️</div>
                <h2 style="margin-top: 0; color: #0f172a;">Verify Your Email</h2>
                <p>Welcome to Stock Watcher! To ensure the security of your account, please verify your email address by clicking the button below.</p>
                
                <a href="{verify_link}" class="btn">Verify Account</a>
                
                <p style="margin-top: 30px; font-size: 14px; color: #94a3b8;">Link expires in 24 hours.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Stock Watcher Inc. • Security Team</p>
                <p style="margin-top: 5px;">If you didn't create this account, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, "Verify your Stock Watcher account", html_content)

# ==========================================
# 3. 📢 BROADCAST / ANNOUNCEMENT EMAIL
# ==========================================
def send_generic_email(to_email: str, subject: str, body: str):
    # Convert newlines to HTML breaks for proper formatting
    formatted_body = body.replace("\n", "<br>")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><style>{COMMON_STYLE}
        .announcement-tag {{ background: #fef3c7; color: #d97706; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 15px; }}
    </style></head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>STOCK WATCHER</h1>
            </div>
            <div class="content">
                <div class="announcement-tag">📢 Announcement</div>
                <h2 style="margin-top: 0; color: #0f172a;">{subject}</h2>
                <div style="font-size: 16px; color: #475569;">
                    {formatted_body}
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <p style="font-size: 14px; color: #64748b;">Best regards,<br><span class="highlight">The Stock Watcher Team</span></p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Stock Watcher Inc. • System Update</p>
                <p style="margin-top: 5px;">You are receiving this email as a registered user.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)
