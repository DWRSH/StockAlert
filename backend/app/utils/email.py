import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURATION ---
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 2525))

# 1. Sender (Visible to User)
SENDER_EMAIL = os.getenv("EMAIL_SENDER") 

# 2. Login ID (Brevo Specific)
SMTP_LOGIN = os.getenv("SMTP_LOGIN", SENDER_EMAIL) 

SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Debug Print
print(f"\n{'='*40}")
print(f"📧 EMAIL CONFIGURATION")
print(f"👉 LOGIN ID:   {SMTP_LOGIN}")
print(f"👉 SENDING AS: {SENDER_EMAIL}")
print(f"{'='*40}\n")

def send_email_sync(to_email: str, subject: str, html_content: str):
    msg = EmailMessage()
    msg["From"] = f"Stock Watcher <{SENDER_EMAIL}>" # Adds a nice Display Name
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(html_content, subtype="html")

    try:
        # print(f"🔄 Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            
            # Login using Brevo ID
            server.login(SMTP_LOGIN, SENDER_PASSWORD)
            
            # Send Message
            server.send_message(msg)
            
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email via {SMTP_SERVER}")
        print(f"❌ Error Details: {e}")
        return False

# --- ASYNC WRAPPERS WITH PROFESSIONAL HTML ---

async def send_email_notification(to_email: str, symbol: str, current_price: float, target_price: float):
    subject = f"🚀 Alert Triggered: {symbol} is now ₹{current_price}"
    
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
                            <div class="price-value">₹{target_price}</div>
                        </td>
                        <td class="price-cell" style="background-color: #f0fdf4;">
                            <div class="price-label">Current Price</div>
                            <div class="price-value price-green">₹{current_price}</div>
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

async def send_verification_email(to_email: str, token: str):
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    verify_link = f"{backend_url}/verify-email?token={token}"
    
    print(f"🔗 Verification Link: {verify_link}")
    
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
                <p>&copy; 2025 Stock Watcher Inc. • Stock Watcher Security Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email_sync(to_email, subject, html_content)

# ✅ NEW FUNCTION: BROADCAST / ANNOUNCEMENT EMAIL
def send_generic_email(to_email: str, subject: str, body: str):
    """
    Admin Announcements ke liye function.
    Ye sync 'send_email_sync' ko call karta hai, 
    jo BackgroundTasks ke saath perfectly kaam karega.
    """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .email-container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .header {{ background-color: #4F46E5; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px; }}
            .content {{ padding: 30px; color: #334155; line-height: 1.6; }}
            .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
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
            <div class="footer">
                <p>&copy; 2025 Stock Watcher Inc. • Automated Broadcast</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email_sync(to_email, subject, html_content)
