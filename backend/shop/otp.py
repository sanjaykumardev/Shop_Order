"""Helpers for admin 2-step (OTP) login.

OTPs are generated server-side, hashed before storage, expire after a
few minutes, and can only be used once. They are delivered by email;
in local development with no SMTP configured, Django's console email
backend prints the message (including the code) to the server output.
"""

import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import AdminOTP

logger = logging.getLogger(__name__)

OTP_LIFETIME_MINUTES = 10


def generate_otp() -> str:
    """6-digit numeric code."""
    return f"{secrets.randbelow(1000000):06d}"


def send_admin_otp(email: str) -> None:
    """Create a fresh OTP for `email` and email it to the account.

    Any previously issued, still-valid OTPs for the same email are
    invalidated so only the latest code works. Also preserves
    the email_verified status across OTP regenerations.
    """

    # Preserve email_verified from existing valid OTPs
    existing_verified = AdminOTP.objects.filter(
        email=email, is_used=False
    ).values("email_verified")

    AdminOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    otp = generate_otp()

    # If there was a previously verified OTP, carry over the verified status
    if existing_verified and existing_verified[0]["email_verified"]:
        AdminOTP.objects.create(
            email=email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=OTP_LIFETIME_MINUTES),
            email_verified=True,
        )
    else:
        AdminOTP.objects.create(
            email=email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=OTP_LIFETIME_MINUTES),
        )

    send_mail(
        subject="Your shop admin login code",
        message=(
            f"Your one-time login code is {otp}.\n\n"
            f"It expires in {OTP_LIFETIME_MINUTES} minutes and can be used "
            f"only once.\n\nIf you didn't request this, you can safely ignore "
            f"this email."
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[email],
        fail_silently=False,
    )

    # The console email backend prints the full message to server output,
    # so this log line gives a quick pointer in local development.
    logger.info("OTP login code issued for %s", email)


def verify_admin_otp(email: str, code: str) -> bool:
    """Return True and consume the code if it is valid and unexpired.

    If the code is valid, mark the email as verified so OTP is not required
    on subsequent logins.
    """

    candidates = AdminOTP.objects.filter(
        email=email,
        is_used=False,
        expires_at__gt=timezone.now(),
    )

    for record in candidates:
        if check_password(code, record.otp_hash):
            record.is_used = True
            record.email_verified = True
            record.save(update_fields=["is_used", "email_verified"])
            return True

    return False
