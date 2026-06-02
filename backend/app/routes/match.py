from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from app.models.schemas import MatchRequest, MatchResponse, MatchKoot
from app.services.chart_builder import build_chart
from app.services.matching import calculate_match
from app.database import get_history_collection

router = APIRouter()


def _match_input_doc(req: MatchRequest) -> dict:
    return {
        "boy": {
            "name": (req.boy.name or "").strip(),
            "birth_date": req.boy.birth_date,
            "birth_time": req.boy.birth_time,
            "birth_place": req.boy.birth_place,
            "house_system": req.boy.house_system,
            "zodiac": req.boy.zodiac,
        },
        "girl": {
            "name": (req.girl.name or "").strip(),
            "birth_date": req.girl.birth_date,
            "birth_time": req.girl.birth_time,
            "birth_place": req.girl.birth_place,
            "house_system": req.girl.house_system,
            "zodiac": req.girl.zodiac,
        },
    }


def _save_match_history_from_request(req: MatchRequest) -> Optional[str]:
    """Persist or update match inputs in MongoDB. Returns history document id."""
    try:
        col = get_history_collection()
        if col is None:
            return None
        input_doc = _match_input_doc(req)

        if req.history_id:
            oid = ObjectId(req.history_id)
            res = col.update_one(
                {"_id": oid, "type": "match"},
                {"$set": {"input": input_doc}},
            )
            if res.matched_count:
                return req.history_id
            return None

        if not req.save_history:
            return None

        existing = col.find_one({"type": "match", "input": input_doc})
        if existing is not None:
            return str(existing["_id"])

        doc = {
            "type": "match",
            "input": input_doc,
            "created_at": datetime.now(timezone.utc),
        }
        ins = col.insert_one(doc)
        return str(ins.inserted_id)
    except Exception:
        return None


@router.post("/calculate", response_model=MatchResponse)
def calculate_kundli_match(req: MatchRequest):
    """
    Compute Ashtakoot Guna Milan (Kundli Matching) for two people.
    Builds both charts, then calculates all 8 koots + Mangal Dosha.
    """
    try:
        boy_chart  = build_chart(req.boy)
        girl_chart = build_chart(req.girl)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = calculate_match(
            boy_chart.model_dump(),
            girl_chart.model_dump(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching calculation failed: {e}")

    sk_raw = result.get("sadsatkut")
    sadsatkut = MatchResponse.SadsatkutResult(**sk_raw) if sk_raw else None

    match_response = MatchResponse(
        total_score=result["total_score"],
        max_score=result["max_score"],
        percentage=result["percentage"],
        grade=result["grade"],
        recommendation=result["recommendation"],
        koots=[MatchKoot(**k) for k in result["koots"]],
        boy_name=req.boy.name or "Boy",
        girl_name=req.girl.name or "Girl",
        boy_nakshatra=result["boy_nakshatra"],
        boy_nakshatra_lord=result["boy_nakshatra_lord"],
        boy_moon_sign=result["boy_moon_sign"],
        girl_nakshatra=result["girl_nakshatra"],
        girl_nakshatra_lord=result["girl_nakshatra_lord"],
        girl_moon_sign=result["girl_moon_sign"],
        boy_mangal_dosha=result["boy_mangal_dosha"],
        girl_mangal_dosha=result["girl_mangal_dosha"],
        mangal_dosha_cancelled=result["mangal_dosha_cancelled"],
        mangal_dosha_note=result["mangal_dosha_note"],
        boy_chart=boy_chart,
        girl_chart=girl_chart,
        sadsatkut=sadsatkut,
    )
    history_id = _save_match_history_from_request(req)
    return match_response.model_copy(update={"history_id": history_id})
