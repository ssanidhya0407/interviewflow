import asyncio
import os
from email_service import EmailService

# Mock environment variables if not present (though we will pass them in the run command)
if not os.getenv("MAIL_USERNAME"):
    print("⚠️ MAIL_USERNAME env var not found in script, relying on passed env vars...")

async def main():
    print("🚀 Starting Email Test...")
    service = EmailService()
    
    recipient = "ssanidhya0407@gmail.com" # Send to self for testing
    subject = "Test Email from InterviewFlow Debugger"
    body = "<h1>It Works!</h1><p>If you are reading this, the SMTP connection is valid.</p>"
    
    print(f"📧 Attempting to send to {recipient}...")
    success = await service.send_email([recipient], subject, body)
    
    if success:
        print("✅ SUCCESS: Email sent successfully!")
    else:
        print("❌ FAILURE: Email could not be sent. Check logs above.")

if __name__ == "__main__":
    asyncio.run(main())
