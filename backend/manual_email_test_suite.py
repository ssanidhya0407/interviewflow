import asyncio
import os
from email_service import EmailService

# Mock environment variables if not present
if not os.getenv("MAIL_USERNAME"):
    print("⚠️ MAIL_USERNAME env var not found in script, relying on passed env vars...")

async def main():
    print("🚀 Starting Manual Email Verification...")
    service = EmailService()
    
    recipient = "ssanidhya0407@gmail.com"
    
    # 1. Send Aesthetic Welcome Email
    print(f"📧 Sending Welcome Email to {recipient}...")
    welcome_body = """
    <p>We are thrilled to have you join our community.</p>
    <p>InterviewFlow.ai is designed to be your personal interview coach, available 24/7. Get started by setting up your first mock interview session tailored to your resume.</p>
    <p>If you have any questions, our support team is here to help.</p>
    """
    await service.send_email(
        [recipient], 
        "Welcome to InterviewFlow.ai", 
        welcome_body,
        cta_text="Start First Session",
        cta_link="http://localhost:3000/setup"
    )
    
    # 2. Send Aesthetic Reminder Email
    print(f"📧 Sending Reminder Email to {recipient}...")
    reminder_body = """
    <p>This is a gentle reminder to keep your momentum going.</p>
    <p>Consistency is key to mastering technical interviews. We recommend completing at least one session per day to see optimal results.</p>
    """
    await service.send_email(
        [recipient], 
        "Your Daily Practice Reminder", 
        reminder_body,
        cta_text="Resume Practice",
        cta_link="http://localhost:3000/dashboard"
    )
    
    print("✅ All emails queued for delivery.")

if __name__ == "__main__":
    asyncio.run(main())
