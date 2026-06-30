"""
Kaal Sarpa Yoga — D1 geometric detection, 12-type classification, mitigating factors.
"""

from __future__ import annotations

from typing import Any

from app.data import kaal_sarpa_data as ref
from app.services.varga import ZODIAC_SIGNS, varga_meta, varga_sign_index
from app.services.yoga_detection import (
    adjust_severity,
    evaluate_mitigations,
)

GRAHAS = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")

# Vargas where a 180° natal Rahu–Ketu axis maps to opposite signs in the divisional chart.
# Other D-N distort the nodal axis — Kaal Sarpa cannot be evaluated there reliably.
VALID_KAAL_SARPA_VARGAS: tuple[int, ...] = (3, 4, 7, 9, 10, 12, 27)

DISCLAIMER = (
    "Kaal Sarpa analysis is interpretive. Formation uses whole-sign arcs between "
    "Rahu and Ketu (all seven grahas on one side). Divisional checks apply the same "
    "rule only on vargas that preserve the nodal axis (D3, D4, D7, D9, D10, D12, D27). "
    "Mitigating factors reduce reported severity but do not remove the yoga. "
    "Consult a qualified Jyotishi for personalized guidance."
)


def _planets(chart: dict) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for p in chart.get("planets", []):
        name = p["name"]
        if name == "North Node":
            out["Rahu"] = {**p, "name": "Rahu"}
        elif name == "South Node":
            out["Ketu"] = {**p, "name": "Ketu"}
        else:
            out[name] = p
    return out


def _asc_sign(chart: dict) -> str:
    angles = chart.get("angles") or {}
    asc = angles.get("ascendant") or {}
    return str(asc.get("sign") or "")


def _whole_sign_house(sign: str, asc_sign: str) -> int:
    if not sign or not asc_sign:
        return 0
    return (ZODIAC_SIGNS.index(sign) - ZODIAC_SIGNS.index(asc_sign)) % 12 + 1


def _sign_in_arc(sign: str, start_sign: str, end_sign: str) -> bool:
    """Whole-sign arc: inclusive of start and end signs; invalid when nodes share a sign."""
    if not sign or not start_sign or not end_sign:
        return False
    if start_sign == end_sign:
        return False
    if sign == start_sign or sign == end_sign:
        return True
    si = ZODIAC_SIGNS.index(sign)
    rs = ZODIAC_SIGNS.index(start_sign)
    es = ZODIAC_SIGNS.index(end_sign)
    if rs < es:
        return rs < si < es
    return si > rs or si < es


def _all_signs_in_arc(signs: list[str], start_sign: str, end_sign: str) -> bool:
    return all(_sign_in_arc(s, start_sign, end_sign) for s in signs)


def _nodes_opposite(sign_a: str, sign_b: str) -> bool:
    """Rahu and Ketu must be in opposite signs (180° axis) for a valid Kaal Sarpa arc."""
    if not sign_a or not sign_b or sign_a == sign_b:
        return False
    return (ZODIAC_SIGNS.index(sign_a) - ZODIAC_SIGNS.index(sign_b)) % 12 == 6


def _detect_sign_arc_presence(
    r_sign: str,
    k_sign: str,
    graha_signs: list[str],
) -> tuple[bool, str | None]:
    """Shared whole-sign Kaal Sarpa check for D1 and eligible divisional charts."""
    if not _nodes_opposite(r_sign, k_sign):
        return False, None
    if len(graha_signs) != 7 or any(not s for s in graha_signs):
        return False, None
    if _all_signs_in_arc(graha_signs, r_sign, k_sign):
        return True, "rahu_to_ketu"
    if _all_signs_in_arc(graha_signs, k_sign, r_sign):
        return True, "ketu_to_rahu"
    return False, None


def _detect_presence(by: dict[str, dict]) -> tuple[bool, str | None, list[str]]:
    """
    D1 Kaal Sarpa — whole-sign arc between Rahu and Ketu signs.
    All seven grahas must fall in one semicircle of signs (Parashari / project default).
    """
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not rahu or not ketu:
        return False, None, []

    r_sign = str(rahu.get("sign", ""))
    k_sign = str(ketu.get("sign", ""))
    r_house = int(rahu.get("house") or 0)
    k_house = int(ketu.get("house") or 0)
    # Nodes cannot share a bhava — invalid / degenerate axis (e.g. Placidus cusp edge cases).
    if r_house and r_house == k_house:
        return False, None, []

    graha_signs = [str(by[g].get("sign", "")) for g in GRAHAS if g in by]
    present, orientation = _detect_sign_arc_presence(r_sign, k_sign, graha_signs)
    if present:
        return True, orientation, list(GRAHAS)
    return False, None, []


def _node_info(p: dict) -> dict[str, Any]:
    return {
        "sign": p.get("sign", ""),
        "house": int(p.get("house") or 0),
        "longitude": float(p.get("longitude") or 0),
    }


def _varga_sign(p: dict, division: int) -> str:
    lon = p.get("longitude")
    if lon is None:
        return ""
    return ZODIAC_SIGNS[varga_sign_index(float(lon), division)]


def _detect_varga_presence(by: dict[str, dict], division: int) -> tuple[bool, str | None]:
    """Whole-sign Kaal Sarpa on D-N; only for vargas that preserve the 180° nodal axis."""
    if division not in VALID_KAAL_SARPA_VARGAS:
        return False, None

    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not rahu or not ketu:
        return False, None

    r_sign = _varga_sign(rahu, division)
    k_sign = _varga_sign(ketu, division)
    graha_signs = [_varga_sign(by[g], division) for g in GRAHAS if g in by]
    return _detect_sign_arc_presence(r_sign, k_sign, graha_signs)


def _scan_divisional_presence(by: dict[str, dict]) -> list[dict[str, Any]]:
    """Kaal Sarpa in eligible divisional charts (same whole-sign rule as D1)."""
    found: list[dict[str, Any]] = []
    for division in VALID_KAAL_SARPA_VARGAS:
        present, orientation = _detect_varga_presence(by, division)
        if not present:
            continue
        meta = varga_meta(division)
        found.append(
            {
                "division": division,
                "name": meta["name"],
                "area": meta["area"],
                "orientation": orientation,
            }
        )
    return found


def calculate_kaal_sarpa(chart: dict) -> dict[str, Any]:
    by = _planets(chart)
    present, orientation, planets_inside = _detect_presence(by)
    divisional_presence = _scan_divisional_presence(by)

    if not present:
        return {
            "present": False,
            "type": None,
            "divisional_presence": divisional_presence,
            "disclaimer": DISCLAIMER,
        }

    rahu = by["Rahu"]
    ketu = by["Ketu"]
    asc = _asc_sign(chart)
    rahu_house = _whole_sign_house(str(rahu.get("sign", "")), asc) or int(rahu.get("house") or 1)
    type_row = ref.type_lookup(rahu_house)
    if type_row is None:
        raise ValueError(f"No Kaal Sarpa type for Rahu house {rahu_house}")

    mitigating_factors, m2_strength = evaluate_mitigations(chart)

    base_severity = type_row["severity_baseline"]
    effective_severity = adjust_severity(base_severity, mitigating_factors, m2_strength)

    return {
        "present": True,
        "type": {
            "house": type_row["house"],
            "name": type_row["name_en"],
            "name_hi": type_row["name_hi"],
            "name_gu": type_row["name_gu"],
            "sanskrit": type_row["sanskrit"],
        },
        "orientation": orientation,
        "rahu": _node_info(rahu),
        "ketu": _node_info(ketu),
        "planets_inside": planets_inside,
        "base_severity": base_severity,
        "effective_severity": effective_severity,
        "impact_area": type_row["impact_area"],
        "impact_types": type_row["impact_types"],
        "life_domains": type_row["life_domains"],
        "conventional_remedies": type_row["conventional_remedies"],
        "modern_remedies": type_row["modern_remedies"],
        "positive_note": type_row["positive_note"],
        "mitigating_factors": mitigating_factors,
        "divisional_presence": divisional_presence,
        "disclaimer": DISCLAIMER,
    }
