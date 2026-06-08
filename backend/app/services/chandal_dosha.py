"""
Guru Chandal (Chandal Dosha) — Jupiter + Rahu/Ketu same-sign detection, mitigations, severity.
"""

from __future__ import annotations

from typing import Any

from app.data import chandal_dosha_data as ref
from app.services.varga import ZODIAC_SIGNS, varga_sign_index
from app.services.yoga_detection import (
    BENEFICS,
    KENDRA,
    SEVERITY_LEVELS,
    TRIKONA,
    adjust_severity,
    detect_mahapurusha_yogas,
    detect_raja_yogas,
    is_afflicted,
    _asc_sign,
    _aspects,
    _houses_ruled_by,
    _in_own_or_exalt,
    _is_combust,
    _is_debilitated,
    _lord_of_house,
    _planet_of_lord,
    _planets,
)

# Parashari functional role of Jupiter by lagna (house-lordship based summary).
_JUPITER_FUNCTIONAL_BY_LAGNA: dict[str, str] = {
    "Aries": "benefic",
    "Taurus": "malefic",
    "Gemini": "malefic",
    "Cancer": "benefic",
    "Leo": "benefic",
    "Virgo": "malefic",
    "Libra": "malefic",
    "Scorpio": "benefic",
    "Sagittarius": "benefic",
    "Capricorn": "malefic",
    "Aquarius": "malefic",
    "Pisces": "benefic",
}

DISCLAIMER = (
    "Guru Chandal (Chandal Dosha) analysis is interpretive. Formation uses Jupiter conjunct Rahu or Ketu "
    "by sign on D1. Mitigating factors reduce reported severity but do not remove the yoga. "
    "This is not medical, legal, or spiritual counselling — consult qualified professionals."
)


def _angular_distance(lon_a: float, lon_b: float) -> float:
    d = abs(lon_a - lon_b) % 360.0
    return min(d, 360.0 - d)


def _conjunction_orb(jupiter: dict, node: dict) -> float:
    """Short-arc degree separation when same sign; defensive wide value if signs differ."""
    if jupiter.get("sign") != node.get("sign"):
        return 30.0
    jl = jupiter.get("longitude")
    nl = node.get("longitude")
    if jl is None or nl is None:
        return 30.0
    # Short arc (e.g. 359° vs 1° → 2°, not 358°); cap at 30° for one-sign span.
    return min(_angular_distance(float(jl), float(nl)), 30.0)


def _conjunction_strength(orb: float) -> str:
    if orb <= 8.0:
        return "close"
    if orb <= 15.0:
        return "moderate"
    return "wide"


def _jupiter_functional_role(chart: dict) -> str:
    """Functional benefic/malefic for Jupiter from lagna (Parashari house-lordship)."""
    asc = _asc_sign(chart)
    if asc in _JUPITER_FUNCTIONAL_BY_LAGNA:
        return _JUPITER_FUNCTIONAL_BY_LAGNA[asc]

    ruled = _houses_ruled_by(chart, "Jupiter")
    if not ruled:
        return "neutral"
    if any(h in (1, 5, 9) for h in ruled):
        return "benefic"
    if all(h in (6, 8, 12) for h in ruled):
        return "malefic"
    if any(h in (6, 8, 12) for h in ruled):
        return "mixed"
    return "neutral"


def _jupiter_dignity(jupiter: dict) -> str:
    sign = str(jupiter.get("sign", ""))
    if sign == "Cancer":
        return "exalted"
    if sign in ("Sagittarius", "Pisces"):
        return "own"
    if sign == "Capricorn":
        return "debilitated"
    return "neutral"


def _increase_severity(base: str, steps: int) -> str:
    base_norm = base.replace("Moderate–High", "Moderate").replace("Moderate-High", "Moderate")
    try:
        idx = SEVERITY_LEVELS.index(base_norm)
    except ValueError:
        idx = 1
    new_idx = max(idx - steps, 0)
    return SEVERITY_LEVELS[new_idx]


def _detect_guru_chandal(by: dict[str, dict]) -> dict[str, Any] | None:
    jup = by.get("Jupiter")
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not jup:
        return None
    js = jup.get("sign")
    if rahu and js == rahu.get("sign"):
        return {"variant": "guru_rahu", "node": rahu, "node_name": "Rahu"}
    if ketu and js == ketu.get("sign"):
        return {"variant": "guru_ketu", "node": ketu, "node_name": "Ketu"}
    return None


def _d9_guru_chandal_note(chart: dict, by: dict[str, dict]) -> bool:
    jup = by.get("Jupiter")
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not jup:
        return False

    def d9_sign(p: dict) -> str:
        lon = p.get("longitude")
        if lon is None:
            return ""
        return ZODIAC_SIGNS[varga_sign_index(float(lon), 9)]

    js9 = d9_sign(jup)
    if not js9:
        return False
    if rahu and js9 == d9_sign(rahu):
        return True
    if ketu and js9 == d9_sign(ketu):
        return True
    return False


def _evaluate_chandal_mitigations(
    chart: dict,
    jupiter: dict,
    orb: float,
    conjunction_strength: str,
) -> tuple[list[dict[str, Any]], str]:
    by = _planets(chart)
    factors: list[dict[str, Any]] = []
    jh = int(jupiter.get("house") or 0)
    dignity = _jupiter_dignity(jupiter)
    combust = _is_combust(jupiter, by)

    # M1 — Strong Jupiter
    m1 = dignity in ("exalted", "own") and not combust
    factors.append(
        {
            "factor": "Strong Jupiter",
            "matched": m1,
            "detail": (
                f"Jupiter {dignity} in {jupiter.get('sign')}"
                + (" (combust)" if combust else "")
                if m1
                else f"Jupiter {dignity}" + (" combust" if combust else "")
            ),
            "weight": "very_high",
            "severity_reduction": "significant" if m1 else "none",
        }
    )

    # M2 — Jupiter in Kendra/Trikona
    m2 = jh in KENDRA | TRIKONA
    factors.append(
        {
            "factor": "Jupiter in Kendra/Trikona",
            "matched": m2,
            "detail": f"Jupiter in house {jh}" if m2 else f"Jupiter in house {jh} (not kendra/trikona)",
            "weight": "high",
            "severity_reduction": "moderate" if m2 else "none",
        }
    )

    # M3 — Strong 9th house / lord
    lord_9 = _planet_of_lord(chart, 9, by)
    benefics_9 = sum(
        1
        for b in BENEFICS
        if (p := by.get(b)) and int(p.get("house") or 0) == 9 and not is_afflicted(p, by)
    )
    lord_9_strong = (
        lord_9 is not None
        and _in_own_or_exalt(lord_9)
        and int(lord_9.get("house") or 0) in KENDRA | TRIKONA
        and not is_afflicted(lord_9, by)
    )
    m3 = lord_9_strong or benefics_9 >= 2
    factors.append(
        {
            "factor": "Strong 9th house / 9th lord",
            "matched": m3,
            "detail": (
                f"9th lord {_lord_of_house(chart, 9)} strong"
                if lord_9_strong
                else (f"{benefics_9} benefic(s) in 9th" if benefics_9 >= 2 else "9th house not strongly supported")
            ),
            "weight": "very_high",
            "severity_reduction": "significant" if m3 else "none",
        }
    )

    # M4 — Wide conjunction orb
    m4 = orb > 15.0
    factors.append(
        {
            "factor": "Wide conjunction orb",
            "matched": m4,
            "detail": f"Jupiter–node separation {orb:.1f}° ({conjunction_strength})",
            "weight": "high",
            "severity_reduction": "moderate" if m4 else "none",
        }
    )

    # M5 — Saturn aspect on Jupiter's house (not universally accepted as cancellation)
    saturn = by.get("Saturn")
    m5 = bool(saturn and _aspects(saturn, jh) and _in_own_or_exalt(saturn))
    factors.append(
        {
            "factor": "Structured Saturn influence",
            "matched": m5,
            "detail": (
                f"Dignified Saturn in {saturn.get('sign')} aspects Jupiter (house {jh})"
                if m5 and saturn
                else "No dignified Saturn aspect on Jupiter"
            ),
            "weight": "moderate",
            "severity_reduction": "moderate" if m5 else "none",
        }
    )

    # M6 — Benefic aspect on Jupiter
    benefic_aspects = [
        b
        for b in ("Moon", "Venus", "Mercury")
        if (p := by.get(b)) and _aspects(p, jh) and not is_afflicted(p, by)
    ]
    m6 = len(benefic_aspects) > 0
    factors.append(
        {
            "factor": "Benefic aspect on Jupiter",
            "matched": m6,
            "detail": f"{', '.join(benefic_aspects)} aspect(s) house {jh}" if m6 else "No unafflicted benefic aspect",
            "weight": "moderate",
            "severity_reduction": "moderate" if m6 else "none",
        }
    )

    # M7 — Hamsa Mahapurusha
    hamsa = [y for y in detect_mahapurusha_yogas(by) if y["planet"] == "Jupiter" and y["strength"] != "weak"]
    m7 = len(hamsa) > 0
    factors.append(
        {
            "factor": "Hamsa Mahapurusha",
            "matched": m7,
            "detail": (
                f"Hamsa Yoga — Jupiter in {hamsa[0]['sign']} house {hamsa[0]['house']}"
                if m7
                else "No strong Hamsa Mahapurusha"
            ),
            "weight": "high",
            "severity_reduction": "moderate" if m7 else "none",
            "mahapurusha_yogas": hamsa if m7 else None,
        }
    )

    # M8 — Raja Yoga
    raja = [y for y in detect_raja_yogas(chart) if not y.get("afflicted")]
    m8 = len(raja) > 0
    raja_strength = "none"
    if len(raja) >= 2:
        raja_strength = "very_strong"
    elif len(raja) == 1:
        raja_strength = "strong"
    factors.append(
        {
            "factor": "Strong Raja Yogas",
            "matched": m8,
            "detail": f"{len(raja)} unafflicted Raja Yoga(s)" if m8 else "No unafflicted Raja Yoga",
            "weight": "high",
            "severity_reduction": "moderate" if m8 else "none",
            "raja_yogas": raja if m8 else None,
        }
    )

    # M9 — Unafflicted Moon (simplified — strict kendra/trikona + own sign was too rare)
    moon = by.get("Moon")
    m9 = bool(moon and not is_afflicted(moon, by))
    factors.append(
        {
            "factor": "Unafflicted Moon",
            "matched": m9,
            "detail": (
                f"Moon in {moon.get('sign')} (house {moon.get('house')}) — not afflicted"
                if m9 and moon
                else "Moon afflicted by debility, combustion, or malefic conjunction"
            ),
            "weight": "moderate",
            "severity_reduction": "moderate" if m9 else "none",
        }
    )

    # M10 — D-9 note (informational)
    d9 = _d9_guru_chandal_note(chart, by)
    factors.append(
        {
            "factor": "D-9 Guru Chandal note",
            "matched": False,
            "detail": (
                "Navamsa also shows Guru+node conjunction (informational)"
                if d9
                else "Navamsa does not repeat Guru Chandal (informational)"
            ),
            "weight": "low",
            "severity_reduction": "none",
            "informational": True,
            "navamsa_repeats": d9,
        }
    )

    return factors, raja_strength


def _planet_info(p: dict) -> dict[str, Any]:
    return {
        "sign": str(p.get("sign", "")),
        "house": int(p.get("house") or 0),
        "longitude": float(p.get("longitude") or 0),
    }


def calculate_chandal_dosha(chart: dict) -> dict[str, Any]:
    by = _planets(chart)
    finding = _detect_guru_chandal(by)

    if not finding:
        return {"present": False, "disclaimer": DISCLAIMER}

    jupiter = by["Jupiter"]
    node = finding["node"]
    variant = finding["variant"]
    jh = int(jupiter.get("house") or 1)

    house_row = ref.house_lookup(jh)
    variant_row = ref.variant_lookup(variant)
    if house_row is None or variant_row is None:
        raise ValueError(f"Missing Chandal data for house {jh} or variant {variant}")

    orb = _conjunction_orb(jupiter, node)
    strength = _conjunction_strength(orb)
    dignity = _jupiter_dignity(jupiter)
    combust = _is_combust(jupiter, by)
    functional_role = _jupiter_functional_role(chart)

    base = house_row["severity_baseline"]
    increase = 0
    if _is_debilitated(jupiter):
        increase += 1
    if combust:
        increase += 1
    if strength == "close":
        increase += 1
    if functional_role == "malefic":
        increase += 1
    if increase:
        base = _increase_severity(base, increase)

    mitigating_factors, raja_strength = _evaluate_chandal_mitigations(chart, jupiter, orb, strength)
    effective = adjust_severity(base, mitigating_factors, raja_strength)

    variant_label = variant_row["label_en"]
    rahu_remedy = ""
    if variant == "guru_rahu":
        rahu_remedy = " Om Bhraam Bhreem Bhraum Sah Rahave Namah for Rahu balance."
    else:
        rahu_remedy = " Om Straam Streem Straum Sah Ketave Namah for Ketu grounding."

    conventional = house_row["conventional_remedies"] + rahu_remedy
    modern = house_row["modern_remedies"]
    if variant == "guru_rahu":
        modern += " Fact-check teachers; reduce status-chasing spirituality."
    else:
        modern += " Structured daily practice; avoid spiritual bypass."

    return {
        "present": True,
        "variant": variant,
        "variant_label": variant_label,
        "variant_label_hi": variant_row["label_hi"],
        "variant_label_gu": variant_row["label_gu"],
        "variant_impact": variant_row["variant_impact"],
        "variant_positive": variant_row["variant_positive"],
        "jupiter": {
            **_planet_info(jupiter),
            "dignity": dignity,
            "functional_role": functional_role,
            "combust": combust,
            "retrograde": bool(jupiter.get("retrograde")),
        },
        "node": {
            "name": finding["node_name"],
            **_planet_info(node),
        },
        "conjunction_orb_degrees": round(orb, 2),
        "conjunction_strength": strength,
        "type": {
            "house": house_row["house"],
            "name": house_row["name_en"],
            "name_hi": house_row["name_hi"],
            "name_gu": house_row["name_gu"],
            "sanskrit_theme": house_row["sanskrit_theme"],
            "house_category": house_row["house_category"],
        },
        "base_severity": base,
        "effective_severity": effective,
        "impact_area": house_row["impact_area"],
        "impact_types": house_row["impact_types"],
        "positive_note": house_row["positive_note"],
        "conventional_remedies": conventional,
        "modern_remedies": modern,
        "mitigating_factors": mitigating_factors,
        "disclaimer": DISCLAIMER,
    }
