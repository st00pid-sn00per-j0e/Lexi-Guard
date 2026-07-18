# Backend/test_resend.py
import os
import resend
from dotenv import load_dotenv
from pathlib import Path

# 1. Explicitly find the .env file in the Backend folder
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

def main() -> None:
    # 2. Now it will actually read from the .env file
    api_key = os.getenv("RESEND_API_KEY")
    
    if not api_key:
        print("❌ RESEND_API_KEY is not set. Check Backend/.env")
        return

    print(f"✅ Loaded API Key: {api_key[:10]}...")
    resend.api_key = api_key

    try:
        r = resend.Emails.send({
            "from": "Lexi-Guard <onboarding@resend.dev>",
            "to": "billyxkhan98@gmail.com",
            "subject": "Direct Resend Test",
            "html": "<p>If you see this, Resend is working perfectly!</p>",
        })
        print("✅ SUCCESS! Email sent. Response:", r)
    except Exception as e:
        print("❌ FAILED! Error:", e)

if __name__ == "__main__":
    main()