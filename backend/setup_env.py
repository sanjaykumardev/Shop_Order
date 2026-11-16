import os

def setup_env():
    print("=" * 50)
    print("Shop Admin OTP Email Setup")
    print("=" * 50)
    print()
    print("This script will configure email settings for OTP delivery.")
    print("You'll need your email address and an SMTP password.")
    print()
    print("If you dont have an SMTP password:")
    print("1. Configure your SMTP service credentials")
    print("2. Get your 16-character password from your email provider")
    print()
    email = input("Enter your email address: ").strip()
    password = input("Enter your SMTP App Password: ").strip()

    env_content = f"""DJANGO_SECRET_KEY=yVBn6H2TwL0s9wv4avsGMsz9oGP9eayvNFS97KIGf34DvnutDX
DEBUG=False
ALLOWED_HOSTS=127.0.0.1,localhost

# Supabase Postgres connection string (required — the app will not start without it).
DATABASE_URL=postgresql://postgres.dxxhstoyzqsfjsbeseyu:Sanjaykumar007@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# Frontend origins allowed to call the API. Add your deployed frontend domain here, e.g.:
# CORS_ALLOWED_ORIGINS=http://localhost:3000,https://shop.yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# --- Email configuration for OTP delivery ---
# To send real emails in production, EMAIL_BACKEND is set in settings.py automatically.
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER={email}
EMAIL_HOST_PASSWORD={password}
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL={email}
"""

    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w") as f:
        f.write(env_content)

    print()
    print("✅ .env file created successfully!")
    print()
    print("The OTP system will now send codes via SMTP")
    print("instead of printing to the terminal.")
    print()
    print("You can now start the server and test the admin login flow.")
    print("POST /api/admin/login/ enter username/password OTP sent to your email")
    print()

if __name__ == "__main__":
    setup_env()