import os
from datetime import datetime, timedelta, timezone

import jwt


def _parse_expires_delta() -> timedelta:
    raw = (os.getenv("JWT_EXPIRES_IN") or "7d").strip().lower()
    if raw.endswith("d"):
        return timedelta(days=int(raw[:-1]))
    if raw.endswith("h"):
        return timedelta(hours=int(raw[:-1]))
    if raw.endswith("m"):
        return timedelta(minutes=int(raw[:-1]))
    return timedelta(days=7)


def create_token(user_id: str, email: str) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not set")

    payload = {
        "id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + _parse_expires_delta(),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not set")
    return jwt.decode(token, secret, algorithms=["HS256"])
