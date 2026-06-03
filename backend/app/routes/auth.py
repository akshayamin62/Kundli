from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.database import get_users_collection
from app.deps.auth import require_auth
from app.models.auth_schemas import LoginRequest, ResendOtpRequest, VerifyOtpRequest
from app.services.captcha_service import generate_captcha_challenge, verify_captcha
from app.services.email_service import send_otp_email
from app.services.jwt_service import create_token
from app.services.otp_service import (
    compare_otp,
    generate_otp,
    hash_otp,
    is_otp_expired,
    otp_expires_at,
)

router = APIRouter()


def _users():
    col = get_users_collection()
    if col is None:
        return None
    return col


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _user_json(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "firstName": doc.get("firstName", ""),
        "lastName": doc.get("lastName", ""),
        "email": doc.get("email", ""),
    }


@router.get("/captcha")
def get_captcha():
    try:
        data = generate_captcha_challenge()
        return {"success": True, "data": data}
    except RuntimeError:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": "Database not configured"},
        )


@router.post("/login")
def login(body: LoginRequest):
    col = _users()
    if col is None:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": "Database not configured"},
        )

    email_key = body.email.lower().strip()
    try:
        answer = int(body.captchaAnswer)
    except (TypeError, ValueError):
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid captcha. Please try again."},
        )

    if not verify_captcha(body.captchaToken, answer):
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid captcha. Please try again."},
        )

    user = col.find_one({"email": email_key})
    if not user:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": "No account found for this email. Please contact your administrator.",
            },
        )

    if not user.get("isActive", True):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "message": "Your account has been deactivated. Please contact support.",
            },
        )

    otp = generate_otp()
    col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "otp": hash_otp(otp),
                "otpExpires": otp_expires_at(10),
                "updatedAt": _now(),
            }
        },
    )

    name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    try:
        send_otp_email(email_key, name, otp)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to send email. Try again later."},
        )

    return {
        "success": True,
        "message": "OTP sent to your email. Please check your inbox.",
        "data": {"email": email_key},
    }


@router.post("/verify-otp")
def verify_otp(body: VerifyOtpRequest):
    col = _users()
    if col is None:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": "Database not configured"},
        )

    email_key = body.email.lower().strip()
    user = col.find_one({"email": email_key})
    if not user:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid email or OTP"},
        )

    stored_otp = user.get("otp")
    expires = user.get("otpExpires")
    if not stored_otp or not expires:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "No OTP found. Please request a new OTP."},
        )

    if is_otp_expired(expires):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "OTP has expired. Please request a new OTP."},
        )

    if not compare_otp(body.otp.strip(), stored_otp):
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid OTP"},
        )

    if not user.get("isActive", True):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "message": "Your account has been deactivated. Please contact support.",
            },
        )

    col.update_one(
        {"_id": user["_id"]},
        {"$set": {"otp": None, "otpExpires": None, "updatedAt": _now()}},
    )

    try:
        token = create_token(str(user["_id"]), email_key)
    except RuntimeError:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Server auth is not configured (JWT_SECRET)."},
        )

    return {
        "success": True,
        "message": "Login successful",
        "data": {"token": token, "user": _user_json(user)},
    }


@router.post("/resend-otp")
def resend_otp(body: ResendOtpRequest):
    col = _users()
    if col is None:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": "Database not configured"},
        )

    email_key = body.email.lower().strip()
    user = col.find_one({"email": email_key})
    if not user:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": "No account found for this email. Please contact your administrator.",
            },
        )

    expires = user.get("otpExpires")
    if expires:
        exp = expires
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        created_ms = exp.timestamp() * 1000 - 10 * 60 * 1000
        seconds_since = (_now().timestamp() * 1000 - created_ms) / 1000
        if seconds_since < 60:
            wait = int(60 - seconds_since) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "message": f"Please wait {wait} seconds before requesting a new code.",
                },
            )

    otp = generate_otp()
    col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "otp": hash_otp(otp),
                "otpExpires": otp_expires_at(10),
                "updatedAt": _now(),
            }
        },
    )

    name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    try:
        send_otp_email(email_key, name, otp)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to send email. Try again later."},
        )

    return {"success": True, "message": "A new OTP has been sent to your email."}


@router.get("/profile")
def profile(auth: dict = Depends(require_auth)):
    col = _users()
    if col is None:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": "Database not configured"},
        )

    user = col.find_one({"_id": ObjectId(auth["user_id"])})
    if not user:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "User not found"},
        )

    return {"success": True, "data": {"user": _user_json(user)}}
