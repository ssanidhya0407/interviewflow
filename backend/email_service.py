import os
import aiosmtplib
from email.message import EmailMessage
from pydantic import EmailStr
from typing import List

class EmailService:
    def __init__(self):
        # Default to Gmail for convenience, but configurable
        self.smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("MAIL_PORT", 587))
        self.username = os.getenv("MAIL_USERNAME")
        self.password = os.getenv("MAIL_PASSWORD")
        self.use_tls = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
        self.mail_from = os.getenv("MAIL_FROM", "noreply@interviewflow.ai")
        
        print(f"📧 EmailService Config: Server={self.smtp_server}:{self.smtp_port}, User={self.username}, TLS={self.use_tls}")
        
        if not self.username or not self.password:
            print("⚠️ EmailService: MAIL_USERNAME or MAIL_PASSWORD not set. Emails will fail to send.")

    def _get_template(self, title: str, content: str, cta_text: str = None, cta_link: str = None) -> str:
        """
        Returns a premium, Apple-inspired HTML email template.
        """
        button_html = ""
        if cta_text and cta_link:
            button_html = f"""
            <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
                <a href="{cta_link}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                    {cta_text} &rarr;
                </a>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1d1d1f; margin: 0; padding: 0; background-color: #f5f5f7; }}
                .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }}
                .header {{ background: #fafafa; padding: 24px 32px; border-bottom: 1px solid #f0f0f0; text-align: center; }}
                .logo {{ font-weight: 700; font-size: 18px; color: #000000; text-decoration: none; letter-spacing: -0.5px; }}
                .content {{ padding: 40px 32px; }}
                .footer {{ background: #f5f5f7; padding: 24px 32px; text-align: center; font-size: 12px; color: #86868b; }}
                h1 {{ font-size: 24px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.5px; color: #1d1d1f; }}
                p {{ font-size: 16px; margin-bottom: 16px; color: #333333; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="logo">InterviewFlow.ai</span>
                </div>
                <div class="content">
                    <h1>{title}</h1>
                    <div style="font-size: 16px; color: #333333;">
                        {content}
                    </div>
                    {button_html}
                </div>
                <div class="footer">
                    <p>&copy; 2026 InterviewFlow.ai. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

    async def send_email(self, recipients: List[str], subject: str, body_content: str, cta_text: str = None, cta_link: str = None):
        """
        Send an HTML email using the premium template.
        """
        if not self.username or not self.password:
            print("❌ Cannot send email: Credentials missing.")
            return False
            
        # Wrap content in the Apple-style template
        full_html = self._get_template(subject, body_content, cta_text, cta_link)
        
        message = EmailMessage()
        message["From"] = self.mail_from
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        message.set_content(full_html, subtype="html")

        try:
            print(f"📧 Connecting to SMTP {self.smtp_server}:{self.smtp_port} as {self.username}...")
            async with aiosmtplib.SMTP(hostname=self.smtp_server, port=self.smtp_port) as smtp:
                if self.use_tls:
                    try:
                        await smtp.starttls()
                    except Exception as tls_error:
                        if "already using TLS" in str(tls_error):
                            print("ℹ️ Connection is already TLS, skipping starttls()")
                        else:
                            raise tls_error
                
                await smtp.login(self.username, self.password)
                await smtp.send_message(message)
                
            print(f"✅ Email sent to {recipients}")
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            import traceback
            traceback.print_exc()
            return False

    async def send_reminder(self, email: str, name: str):
        """
        Send a practice reminder email.
        """
        subject = "Time to Practice! 🚀"
        body = f"""
        <html>
            <body>
                <h1>Hi {name or 'There'},</h1>
                <p>It's been a while since your last mock interview on InterviewFlow.ai.</p>
                <p>Consistency is key to landing your dream job!</p>
                <br>
                <a href="http://localhost:3000" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Practice Session</a>
                <br><br>
                <p>Keep grinding,<br>The InterviewFlow Team</p>
            </body>
        </html>
        """
        return await self.send_email([email], subject, body)
