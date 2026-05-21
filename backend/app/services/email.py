import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

log = logging.getLogger(__name__)

_BRAND = "#f8930f"
_BASE_STYLE = f"""
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb; margin: 0; padding: 0;
"""


def _wrap(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="{_BASE_STYLE}">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;
               border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:{_BRAND};padding:20px 32px;">
      <span style="color:#fff;font-size:20px;font-weight:700;">⭐ OlimQ&amp;A</span>
    </div>
    <div style="padding:32px;">
      {body_html}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;
                font-size:12px;color:#9ca3af;text-align:center;">
      Community for Olim Chadashim &amp; Lone Soldiers in Israel
    </div>
  </div>
</body></html>"""


async def _send(to: str, subject: str, html: str) -> None:
    if not settings.smtp_host:
        return
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))
    try:
        kwargs: dict = {"hostname": settings.smtp_host, "port": settings.smtp_port}
        if settings.smtp_user:
            kwargs["username"] = settings.smtp_user
            kwargs["password"] = settings.smtp_password
        if settings.smtp_tls:
            kwargs["use_tls"] = True
        elif settings.smtp_starttls:
            kwargs["start_tls"] = True
        await aiosmtplib.send(msg, **kwargs)
    except Exception:
        log.exception("Failed to send email to %s", to)


async def send_confirmation_email(to: str, display_name: str, token: str) -> None:
    url = f"{settings.frontend_url}/confirm-email?token={token}"
    body = f"""
      <h2 style="color:#111827;margin-top:0;">Confirm your email</h2>
      <p style="color:#374151;">Hi <strong>{display_name}</strong>,</p>
      <p style="color:#374151;">Welcome to OlimQ&A! Click the button below to verify your email
      address and activate your account.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{url}"
           style="background:{_BRAND};color:#fff;padding:12px 28px;border-radius:6px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          Confirm Email
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;">
        This link expires in 24 hours. If you didn't create an account you can ignore this email.
      </p>
      <p style="color:#6b7280;font-size:12px;word-break:break-all;">
        Or copy this link: <a href="{url}" style="color:{_BRAND};">{url}</a>
      </p>
    """
    await _send(to, "Confirm your OlimQ&A email address", _wrap(body))


async def send_answer_notification(
    to: str,
    question_author: str,
    question_title: str,
    question_id: int,
    answerer_name: str,
) -> None:
    url = f"{settings.frontend_url}/questions/{question_id}"
    body = f"""
      <h2 style="color:#111827;margin-top:0;">New answer to your question</h2>
      <p style="color:#374151;">Hi <strong>{question_author}</strong>,</p>
      <p style="color:#374151;">
        <strong>{answerer_name}</strong> just posted an answer to your question:
      </p>
      <div style="background:#f9fafb;border-left:4px solid {_BRAND};
                  padding:12px 16px;margin:20px 0;border-radius:0 6px 6px 0;">
        <a href="{url}" style="color:#111827;font-weight:600;text-decoration:none;">
          {question_title}
        </a>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="{url}"
           style="background:{_BRAND};color:#fff;padding:12px 28px;border-radius:6px;
                  text-decoration:none;font-weight:600;font-size:15px;">
          View Answer
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;">
        You can manage notification preferences from your profile settings.
      </p>
    """
    await _send(to, f"New answer: {question_title}", _wrap(body))
