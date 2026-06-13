from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps.auth import require_auth
from datetime import datetime, timezone
from typing import Literal, Optional
import pytz
from bson import ObjectId
from pydantic import BaseModel
from app.database import get_history_collection

router = APIRouter(dependencies=[Depends(require_auth)])

IST = pytz.timezone("Asia/Kolkata")


def _created_at_ist_iso(dt: datetime | None) -> str | None:
    """Serialize stored UTC timestamp as IST ISO string for API clients."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).isoformat(timespec="seconds")


def _serialize(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serialisable dict."""
    doc["id"] = str(doc.pop("_id"))
    if "created_at" in doc and doc["created_at"] is not None:
        doc["created_at"] = _created_at_ist_iso(doc["created_at"])
    inp = doc.get("input") or {}
    if doc.get("type") == "kundali":
        doc["name"] = inp.get("name")
        doc["birth_date"] = inp.get("birth_date")
        doc["birth_time"] = inp.get("birth_time")
        doc["birth_place"] = inp.get("birth_place")
        if inp.get("birth_lat") is not None:
            doc["birth_lat"] = inp.get("birth_lat")
        if inp.get("birth_lon") is not None:
            doc["birth_lon"] = inp.get("birth_lon")
    elif doc.get("type") == "match":
        boy = inp.get("boy") or {}
        girl = inp.get("girl") or {}
        doc["boy_name"] = boy.get("name")
        doc["boy_birth_date"] = boy.get("birth_date")
        doc["boy_birth_time"] = boy.get("birth_time")
        doc["boy_birth_place"] = boy.get("birth_place")
        if boy.get("birth_lat") is not None:
            doc["boy_birth_lat"] = boy.get("birth_lat")
        if boy.get("birth_lon") is not None:
            doc["boy_birth_lon"] = boy.get("birth_lon")
        doc["girl_name"] = girl.get("name")
        doc["girl_birth_date"] = girl.get("birth_date")
        doc["girl_birth_time"] = girl.get("birth_time")
        doc["girl_birth_place"] = girl.get("birth_place")
        if girl.get("birth_lat") is not None:
            doc["girl_birth_lat"] = girl.get("birth_lat")
        if girl.get("birth_lon") is not None:
            doc["girl_birth_lon"] = girl.get("birth_lon")
    return doc


def _summary(doc: dict) -> dict:
    """Strip heavy chart/result payload — return only list-view fields."""
    doc.pop("chart", None)
    doc.pop("result", None)
    return doc


@router.get("", tags=["History"])
def list_history(
    search: Optional[str] = Query(None, description="Search by name / place"),
    type: Optional[str] = Query(None, description="Filter: kundali | match"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
):
    """
    Return a paginated, searchable list of kundali and match history entries.
    """
    col = get_history_collection()
    if col is None:
        return {"items": [], "total": 0}

    query: dict = {}

    if type in ("kundali", "match"):
        query["type"] = type

    if search:
        pattern = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"input.name": pattern},
            {"input.birth_place": pattern},
            {"input.boy.name": pattern},
            {"input.girl.name": pattern},
            {"input.boy.birth_place": pattern},
            {"input.girl.birth_place": pattern},
        ]

    total = col.count_documents(query)
    docs = list(col.find(query).sort("created_at", -1).skip(skip).limit(limit))

    return {
        "items": [_serialize(d) for d in docs],
        "total": total,
    }


class HistoryLookupBody(BaseModel):
    type: Literal["kundali", "match"]
    input: dict


@router.post("/lookup", tags=["History"])
def lookup_history(body: HistoryLookupBody):
    """Find an existing history row by exact stored input (no insert)."""
    col = get_history_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    doc = col.find_one({"type": body.type, "input": body.input})
    if doc is None:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"id": str(doc["_id"])}


@router.get("/{item_id}", tags=["History"])
def get_history_item(item_id: str):
    """Return a single history record including full chart / match result."""
    col = get_history_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")

    doc = col.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="History item not found")

    return _serialize(doc)


@router.delete("/{item_id}", tags=["History"])
def delete_history_item(item_id: str):
    """Permanently delete a history entry."""
    col = get_history_collection()
    if col is None:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")

    result = col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History item not found")

    return {"ok": True}
