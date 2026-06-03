import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _send_raw(to: str, subject: str, html: str, text: str) -> None:
    address = os.getenv("EMAIL_ADDRESS", "").strip()
    password = os.getenv("EMAIL_PASSWORD", "").strip()

    if not address or not password:
        print("=" * 50)
        print("EMAIL (dev — no SMTP credentials)")
        print("To:", to)
        print("Subject:", subject)
        print(text)
        print("=" * 50)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f'"Astrogyan Kundli" <{address}>'
    msg["To"] = to
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(address, password)
        server.sendmail(address, [to], msg.as_string())

    print(f"[Email] OTP sent to {to}")


def send_otp_email(email: str, name: str, otp: str) -> None:
    display = name.strip() or "there"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:20px auto;padding:30px;border:1px solid #ddd;">
      <h2>Your login code</h2>
      <p>Hi {display},</p>
      <p>Your Astrogyan verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:5px;">{otp}</p>
      <p style="color:#666;font-size:14px;">This code expires in 10 minutes.</p>
    </div>
    """
    text = f"Hi {display},\n\nYour Astrogyan login code is: {otp}\n\nExpires in 10 minutes."
    _send_raw(email, "Your Astrogyan login code", html, text)
