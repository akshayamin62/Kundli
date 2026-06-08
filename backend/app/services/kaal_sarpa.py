"""
Kaal Sarpa Yoga — D1 geometric detection, 12-type classification, mitigating factors.
"""

from __future__ import annotations

import math
from typing import Any

from app.data import kaal_sarpa_data as ref
from app.services.yoga_detection import (
    adjust_severity,
    evaluate_mitigations,
)

GRAHAS = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")

DISCLAIMER = (
    "Kaal Sarpa analysis is interpretive. Formation uses a strict geometric rule on D1 "
    "(all seven grahas between Rahu and Ketu). Mitigating factors reduce reported severity "
    "but do not remove the yoga. Consult a qualified Jyotishi for personalized guidance."
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


def _norm_lon(lon: float) -> float:
    return lon % 360.0


def _in_open_arc(lon: float, start: float, end: float) -> bool:
    lon = _norm_lon(lon)
    start = _norm_lon(start)
    end = _norm_lon(end)
    if math.isclose(start, end):
        return False
    if start < end:
        return start < lon < end
    return lon > start or lon < end


def _planet_in_arc(
    planet: dict,
    start_lon: float,
    end_lon: float,
    rahu_sign: str,
    ketu_sign: str,
) -> bool:
    sign = planet.get("sign", "")
    if sign == rahu_sign or sign == ketu_sign:
        return True
    lon = planet.get("longitude")
    if lon is None:
        return False
    return _in_open_arc(float(lon), start_lon, end_lon)


def _all_grahas_in_arc(
    by: dict[str, dict],
    start_lon: float,
    end_lon: float,
    rahu_sign: str,
    ketu_sign: str,
) -> bool:
    for g in GRAHAS:
        p = by.get(g)
        if not p:
            return False
        if not _planet_in_arc(p, start_lon, end_lon, rahu_sign, ketu_sign):
            return False
    return True


def _detect_presence(by: dict[str, dict]) -> tuple[bool, str | None, list[str]]:
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not rahu or not ketu:
        return False, None, []

    r_lon = float(rahu["longitude"])
    k_lon = float(ketu["longitude"])
    r_sign = str(rahu.get("sign", ""))
    k_sign = str(ketu.get("sign", ""))

    inside: list[str] = []
    if _all_grahas_in_arc(by, r_lon, k_lon, r_sign, k_sign):
        return True, "rahu_to_ketu", list(GRAHAS)
    if _all_grahas_in_arc(by, k_lon, r_lon, r_sign, k_sign):
        return True, "ketu_to_rahu", list(GRAHAS)
    return False, None, []


def _node_info(p: dict) -> dict[str, Any]:
    return {
        "sign": p.get("sign", ""),
        "house": int(p.get("house") or 0),
        "longitude": float(p.get("longitude") or 0),
    }


def calculate_kaal_sarpa(chart: dict) -> dict[str, Any]:
    by = _planets(chart)
    present, orientation, planets_inside = _detect_presence(by)

    if not present:
        return {
            "present": False,
            "type": None,
            "disclaimer": DISCLAIMER,
        }

    rahu = by["Rahu"]
    ketu = by["Ketu"]
    rahu_house = int(rahu.get("house") or 1)
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
        "disclaimer": DISCLAIMER,
    }
