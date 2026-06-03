import hashlib
import secrets
from datetime import datetime, timedelta, timezone


def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def compare_otp(otp: str, hashed: str) -> bool:
    return hash_otp(otp) == hashed


def otp_expires_at(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def is_otp_expired(expires_at: datetime | None) -> bool:
    if expires_at is None:
        return True
    exp = expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) > exp
