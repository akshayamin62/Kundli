from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from bson import ObjectId
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.database import get_users_collection
from app.services.jwt_service import decode_token

_bearer = HTTPBearer(auto_error=False)


def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        payload = decode_token(credentials.credentials)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except (InvalidTokenError, RuntimeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    col = get_users_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    user_id = payload.get("id")
    email = (payload.get("email") or "").lower().strip()
    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = col.find_one({"_id": oid, "email": email, "isActive": True})
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
    }
