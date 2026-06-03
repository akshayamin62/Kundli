"""
MongoDB connection helper.
Gracefully returns None when MONGODB_URI is not set or the connection fails,
so all existing routes continue to work without a database.
"""

import os
from typing import Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.uri_parser import parse_uri

_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_db() -> Optional[Database]:
    global _client, _db
    if _db is not None:
        return _db

    uri = os.getenv("MONGODB_URI", "")
    if not uri or "<db_password>" in uri:
        return None

    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")

        # Prefer database name from URI (e.g. ...mongodb.net/Kundli?...),
        # otherwise use env fallback, then default to "Kundli".
        parsed = parse_uri(uri)
        db_name = parsed.get("database") or os.getenv("MONGODB_DB_NAME", "Kundli")

        _db = _client[db_name]
        print(f"[MongoDB] Connected to database: {db_name}")
        return _db
    except Exception as exc:
        print(f"[MongoDB] Connection failed: {exc}")
        _client = None
        _db = None
        return None


def get_history_collection() -> Optional[Collection]:
    db = get_db()
    if db is None:
        return None
    return db["history"]


def get_users_collection() -> Optional[Collection]:
    db = get_db()
    if db is None:
        return None
    return db["users"]


def get_captcha_collection() -> Optional[Collection]:
    db = get_db()
    if db is None:
        return None
    return db["captcha"]


def ensure_auth_indexes() -> None:
    """Create indexes for auth collections (idempotent)."""
    users = get_users_collection()
    if users is not None:
        users.create_index("email", unique=True)
    captcha = get_captcha_collection()
    if captcha is not None:
        captcha.create_index("expiresAt", expireAfterSeconds=0)
