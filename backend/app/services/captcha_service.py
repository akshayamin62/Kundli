import secrets
from datetime import datetime, timedelta, timezone

from app.database import get_captcha_collection


def _rand_challenge() -> tuple[str, int]:
    import random

    op = random.choice(["+", "-", "×"])
    if op == "+":
        a, b = random.randint(1, 10), random.randint(1, 10)
        answer = a + b
    elif op == "-":
        a = random.randint(1, 10)
        b = random.randint(0, a - 1)
        answer = a - b
    else:
        a, b = random.randint(2, 10), random.randint(2, 10)
        answer = a * b
    return f"{a} {op} {b} = ?", answer


def generate_captcha_challenge() -> dict[str, str]:
    col = get_captcha_collection()
    if col is None:
        raise RuntimeError("Database not configured")

    question, answer = _rand_challenge()
    token = secrets.token_hex(16)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    col.insert_one({"token": token, "answer": answer, "expiresAt": expires_at})
    return {"token": token, "question": question}


def verify_captcha(token: str, user_answer: int) -> bool:
    col = get_captcha_collection()
    if col is None:
        return False

    doc = col.find_one_and_delete(
        {"token": token, "expiresAt": {"$gt": datetime.now(timezone.utc)}}
    )
    if not doc:
        return False
    return doc.get("answer") == user_answer
