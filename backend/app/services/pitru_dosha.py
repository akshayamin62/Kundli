"""
Pitru Dosha — strict Excel-based detection.

Sign-wise and house-wise are separate:
- Sign findings → Sign Wise Combos only (same-sign yogas, nodal sign-axis by Rahu/Ketu rashi).
- House findings → House Wise Combos only (planet in bhava, nodal house-axis by Rahu/Ketu bhava).
"""

from __future__ import annotations

import re
from typing import Any

from app.data import pitru_dosha_data as ref
from app.services.varga import ZODIAC_SIGNS, varga_sign_index
from app.services.yoga_detection import (
    DEBILITATION,
    _afflicted_by_rahu_ketu,
    is_afflicted,
    list_afflicted_planets,
)

SIGN_LORDS = {
    "Aries": "Mars",
    "Taurus": "Venus",
    "Gemini": "Mercury",
    "Cancer": "Moon",
    "Leo": "Sun",
    "Virgo": "Mercury",
    "Libra": "Venus",
    "Scorpio": "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn",
    "Aquarius": "Saturn",
    "Pisces": "Jupiter",
}

# Sign-axis: anchor sign → Excel combination (Rahu's rashi first; Ketu fallback).
AXIS_SIGN_COMBO_BY_SIGN: dict[frozenset[str], dict[str, str]] = {
    frozenset({"Taurus", "Scorpio"}): {
        "Taurus": "Rahu/Ketu in Taurus-Scorpio axis",
        "Scorpio": "Rahu/Ketu in Taurus-Scorpio axis",
    },
    frozenset({"Gemini", "Sagittarius"}): {
        "Gemini": "Rahu/Ketu in Gemini-Sagittarius axis",
        "Sagittarius": "Rahu/Ketu in Gemini-Sagittarius axis",
    },
    frozenset({"Cancer", "Capricorn"}): {
        "Cancer": "Rahu/Ketu in Cancer-Capricorn axis",
        "Capricorn": "Rahu/Ketu in Cancer-Capricorn axis",
    },
    frozenset({"Aries", "Libra"}): {
        "Aries": "Rahu/Ketu in Libra-Aries axis",
        "Libra": "Rahu/Ketu in Libra-Aries axis",
    },
    frozenset({"Virgo", "Pisces"}): {
        "Virgo": "Rahu/Ketu in Virgo-Pisces axis",
        "Pisces": "Rahu/Ketu in Virgo-Pisces axis",
    },
}

# House-axis: unified combination per pair; lookup works from either bhava.
AXIS_HOUSE_COMBO_BY_HOUSE: dict[frozenset[int], str] = {
    frozenset({1, 7}): "Rahu/Ketu in 1st-7th axis",
    frozenset({2, 8}): "Rahu/Ketu in 2nd-8th axis",
    frozenset({3, 9}): "Rahu/Ketu in 3rd-9th axis",
    frozenset({4, 10}): "Rahu/Ketu in 4th-10th axis",
    frozenset({5, 11}): "Rahu/Ketu in 5th-11th axis",
    frozenset({6, 12}): "Rahu/Ketu in 6th-12th axis",
}

NODE_9TH_SIGN_COMBO = "Rahu/Ketu affecting 9th"
SUN_WEAK_VARGA_COMBO = "Sun weak in D-9/D-12 despite Leo placement"


def _ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def _house_label(n: int) -> str:
    return f"{_ordinal(n)} House"


def _janma_rashi(chart: dict) -> str | None:
    for p in chart.get("planets", []):
        if p.get("name") == "Moon":
            return str(p.get("sign", ""))
    return None


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


def _same_sign(a: dict, b: dict) -> bool:
    return a.get("sign") == b.get("sign")


def _asc_sign(chart: dict) -> str:
    angles = chart.get("angles") or {}
    asc = angles.get("ascendant") or {}
    sign = str(asc.get("sign") or "")
    if sign in ZODIAC_SIGNS:
        return sign
    return _house_sign(chart, 1)


def _whole_sign_house(sign: str, asc_sign: str) -> int:
    if not sign or not asc_sign:
        return 0
    if sign not in ZODIAC_SIGNS or asc_sign not in ZODIAC_SIGNS:
        return 0
    return (ZODIAC_SIGNS.index(sign) - ZODIAC_SIGNS.index(asc_sign)) % 12 + 1


def _house_of(p: dict, chart: dict | None = None) -> int:
    """Whole-sign bhava from planet rashi and lagna (Parashari default for pitru)."""
    if chart is not None:
        ws = _whole_sign_house(str(p.get("sign") or ""), _asc_sign(chart))
        if ws:
            return ws
    return int(p.get("house") or 0)


def _pitru_lord_of_house(chart: dict, by: dict[str, dict], house_num: int) -> dict | None:
    """
    Lord for '{n}th lord' pitru combos.

    For 11th-lord rows when lagna is Aquarius (11th rashi), pitru references use
    the lagna lord Saturn — lord of the 11th zodiac sign — not Jupiter (lord of
    the 11th bhava, Sagittarius).
    """
    asc = _asc_sign(chart)
    if house_num == 11 and asc == "Aquarius":
        lord_name = SIGN_LORDS.get(asc)
        return by.get(lord_name) if lord_name else None
    return _house_lord(chart, house_num, by)


def _varga_sign(longitude: float, n: int) -> str:
    return ZODIAC_SIGNS[varga_sign_index(longitude, n)]


def _sun_weak_in_varga(by: dict[str, dict], n: int) -> tuple[bool, str | None]:
    """Sun debilitated or with Saturn/Rahu/Ketu in same sign in D-N."""
    sun = by.get("Sun")
    if not sun or sun.get("longitude") is None:
        return False, None
    sun_sign = _varga_sign(float(sun["longitude"]), n)
    if sun_sign == DEBILITATION["Sun"]:
        return True, sun_sign
    for pname in ("Saturn", "Rahu", "Ketu"):
        other = by.get(pname)
        if other and other.get("longitude") is not None:
            if _varga_sign(float(other["longitude"]), n) == sun_sign:
                return True, sun_sign
    return False, None


def _house_sign(chart: dict, num: int) -> str:
    """Whole-sign rashi on the Nth bhava (Parashari default for pitru)."""
    asc = _asc_sign(chart)
    if asc in ZODIAC_SIGNS and 1 <= num <= 12:
        return ZODIAC_SIGNS[(ZODIAC_SIGNS.index(asc) + num - 1) % 12]
    for h in chart.get("houses", []):
        if int(h.get("number", 0)) == num:
            return str(h.get("sign", "Aries"))
    return "Aries"


def _by_for_affliction(chart: dict, by: dict[str, dict]) -> dict[str, dict]:
    """Planet dicts with whole-sign houses for affliction / node drishti."""
    return {name: {**planet, "house": _house_of(planet, chart)} for name, planet in by.items()}


def _is_afflicted_in_chart(planet: dict, chart: dict, by: dict[str, dict]) -> bool:
    by_ws = _by_for_affliction(chart, by)
    name = str(planet.get("name", ""))
    if name == "North Node":
        name = "Rahu"
    elif name == "South Node":
        name = "Ketu"
    p = by_ws.get(name) or {**planet, "house": _house_of(planet, chart)}
    return is_afflicted(p, by_ws)


def _afflicted_by_rahu_ketu_in_chart(planet: dict, chart: dict, by: dict[str, dict]) -> bool:
    by_ws = _by_for_affliction(chart, by)
    name = str(planet.get("name", ""))
    p = by_ws.get(name) or {**planet, "house": _house_of(planet, chart)}
    return _afflicted_by_rahu_ketu(p, by_ws)


def _house_lord(chart: dict, house_num: int, by: dict[str, dict]) -> dict | None:
    lord_name = SIGN_LORDS.get(_house_sign(chart, house_num))
    return by.get(lord_name) if lord_name else None


def _parse_house_num(token: str) -> int:
    return int(re.sub(r"(?:st|nd|rd|th)$", "", token, flags=re.I))


def _parse_lord_placement(combo: str) -> tuple[int, list[int], bool] | None:
    """
    Parse house-lord placement combos from pitru_dosha_data.
    Returns (lord_of_house, [placement_houses], require_afflicted).
    """
    patterns: list[tuple[str, bool]] = [
        (r"^(\d+(?:st|nd|rd|th)?) lord in (\d+(?:st|nd|rd|th)?)/(\d+(?:st|nd|rd|th)?) afflicted$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord in (\d+(?:st|nd|rd|th)?) afflicted$", True),
        (r"^Afflicted (\d+(?:st|nd|rd|th)?) lord in (\d+(?:st|nd|rd|th)?)$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord afflicted in (\d+(?:st|nd|rd|th)?)$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord in (\d+(?:st|nd|rd|th)?) but afflicted$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord afflicted from (\d+(?:st|nd|rd|th)?)$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord afflicted$", True),
        (r"^(\d+(?:st|nd|rd|th)?) lord in (\d+(?:st|nd|rd|th)?)$", False),
    ]
    for pattern, require_afflicted in patterns:
        m = re.match(pattern, combo, re.I)
        if not m:
            continue
        groups = m.groups()
        if len(groups) == 3:
            return (
                _parse_house_num(groups[0]),
                [_parse_house_num(groups[1]), _parse_house_num(groups[2])],
                require_afflicted,
            )
        if len(groups) == 2:
            return (
                _parse_house_num(groups[0]),
                [_parse_house_num(groups[1])],
                require_afflicted,
            )
        if len(groups) == 1:
            house = _parse_house_num(groups[0])
            return house, [house], require_afflicted
    return None


def _detect_lord_placements(
    chart: dict,
    by: dict[str, dict],
    push_house: Any,
) -> None:
    """Match '{n}th lord in {m}th afflicted' and related rows from pitru_dosha_data."""
    seen: set[str] = set()
    for row in ref.HOUSE_WISE:
        combo = row["combination"]
        if combo in seen:
            continue
        parsed = _parse_lord_placement(combo)
        if not parsed:
            continue
        seen.add(combo)
        lord_of_house, placement_houses, require_afflicted = parsed
        lord = _pitru_lord_of_house(chart, by, lord_of_house)
        if not lord:
            continue
        lh = _house_of(lord, chart)
        if lh not in placement_houses:
            continue
        if require_afflicted and not _is_afflicted_in_chart(lord, chart, by):
            continue
        if not require_afflicted and _is_afflicted_in_chart(lord, chart, by):
            continue
        push_house(
            combo,
            lh,
            lord["sign"],
            f"{lord_of_house}th lord ({lord['name']}) in {_ordinal(lh)} house",
        )


def _house_combo_in_house(base: str, house: int) -> str:
    return f"{base} in {_ordinal(house)}"


def _build_sign_finding(combination: str, sign: str, detail: str) -> dict | None:
    sr = ref.sign_lookup(sign, combination)
    if not sr:
        return None
    return {
        "combination": combination,
        "sign": sign,
        "detail": detail,
        "sign_wise_impact": sr["general_impact"],
        "sign_wise_severity": sr.get("severity") or None,
        "nature_theme": sr["nature_theme"],
        "stronger_houses": sr["stronger_houses"],
        "conventional_remedies": sr.get("conventional_remedies"),
        "modern_remedies": sr.get("modern_remedies"),
    }


def _push_axis_sign(
    sign_findings: list[dict],
    sign_keys: set[tuple[str, str, str]],
    rahu_sign: str,
    ketu_sign: str,
    detail: str,
) -> None:
    """One sign-wise axis card; display both Rahu and Ketu rashi."""
    pair = frozenset({rahu_sign, ketu_sign})
    by_sign = AXIS_SIGN_COMBO_BY_SIGN.get(pair)
    if not by_sign:
        return
    for anchor in (rahu_sign, ketu_sign):
        combo = by_sign.get(anchor)
        if not combo:
            continue
        key = (combo, rahu_sign, ketu_sign)
        if key in sign_keys:
            return
        row = _build_sign_finding(combo, anchor, detail)
        if row:
            row["rahu_sign"] = rahu_sign
            row["ketu_sign"] = ketu_sign
            sign_keys.add(key)
            sign_findings.append(row)
            return


def _push_axis_house(
    house_findings: list[dict],
    house_keys: set[tuple[str, int, int]],
    rahu_house: int,
    ketu_house: int,
    rahu_sign: str,
    ketu_sign: str,
    detail: str,
) -> None:
    """One house-wise axis card; lookup from either Rahu or Ketu bhava."""
    pair = frozenset({rahu_house, ketu_house})
    combo = AXIS_HOUSE_COMBO_BY_HOUSE.get(pair)
    if not combo:
        return
    key = (combo, rahu_house, ketu_house)
    if key in house_keys:
        return
    anchor = rahu_house if rahu_house in pair else ketu_house
    row = _build_house_finding(combo, anchor, rahu_sign, detail)
    if row:
        row["rahu_sign"] = rahu_sign
        row["ketu_sign"] = ketu_sign
        row["rahu_house"] = rahu_house
        row["ketu_house"] = ketu_house
        house_keys.add(key)
        house_findings.append(row)


def _build_house_finding(
    combination: str,
    house: int,
    planet_sign: str,
    detail: str,
    *,
    lookup_house_label: str | None = None,
) -> dict | None:
    label = lookup_house_label or _house_label(house)
    hr = ref.house_lookup(label, combination)
    if not hr:
        return None
    domains = hr.get("domains", {})
    health = domains.get("health", {})
    return {
        "combination": combination,
        "house": house,
        "house_label": label,
        "sign": planet_sign,
        "detail": detail,
        "house_wise_impact": health.get("impact"),
        "house_wise_severity": health.get("severity") or None,
        "health_focus": health.get("area_affected"),
        "domains": domains,
        "conventional_remedies": health.get("conventional_remedies"),
        "modern_remedies": health.get("modern_remedies"),
    }


def _detect(chart: dict) -> tuple[list[dict], list[dict]]:
    by = _planets(chart)
    sign_findings: list[dict] = []
    house_findings: list[dict] = []
    sign_keys: set[tuple[str, str] | tuple[str, str, str]] = set()
    house_keys: set[tuple[str, int] | tuple[str, int, int]] = set()

    def push_sign(
        combination: str,
        signs: list[str],
        detail: str,
        *,
        lookup_combo: str | None = None,
    ) -> None:
        combo = lookup_combo or combination
        for sign in signs:
            key = (combo, sign)
            if key in sign_keys:
                continue
            row = _build_sign_finding(combo, sign, detail)
            if row:
                sign_keys.add(key)
                sign_findings.append(row)
                return

    def push_house(
        combination: str,
        house: int,
        planet_sign: str,
        detail: str,
        *,
        lookup_house_label: str | None = None,
    ) -> None:
        key = (combination, house)
        if key in house_keys:
            return
        row = _build_house_finding(
            combination,
            house,
            planet_sign,
            detail,
            lookup_house_label=lookup_house_label,
        )
        if row:
            house_keys.add(key)
            house_findings.append(row)

    def push_general(combination: str, planet_sign: str, detail: str, *, house: int = 0) -> None:
        push_house(
            combination,
            house,
            planet_sign,
            detail,
            lookup_house_label="General",
        )

    sun = by.get("Sun")
    moon = by.get("Moon")
    mars = by.get("Mars")
    mercury = by.get("Mercury")
    jupiter = by.get("Jupiter")
    venus = by.get("Venus")
    saturn = by.get("Saturn")
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")

    # ── Sign-wise: same-sign conjunctions ───────────────────────────────────
    for label, a, b in [
        ("Sun + Rahu", sun, rahu),
        ("Sun + Ketu", sun, ketu),
        ("Saturn + Rahu", saturn, rahu),
        ("Saturn + Ketu", saturn, ketu),
        ("Moon + Rahu", moon, rahu),
        ("Moon + Ketu", moon, ketu),
    ]:
        if a and b and _same_sign(a, b):
            h = _house_of(a, chart)
            detail = f"{label} in {a['sign']} (house {h})"
            push_sign(label, [a["sign"]], detail)
            push_house(_house_combo_in_house(label, h), h, a["sign"], detail)

    if sun and rahu and _same_sign(sun, rahu) and sun.get("sign") == "Libra":
        h = _house_of(sun, chart)
        detail = "Debilitated Sun with Rahu in Libra"
        push_sign("Debilitated Sun + Rahu", ["Libra"], detail)
        push_house(_house_combo_in_house("Sun + Rahu", h), h, "Libra", detail)

    if sun and saturn and _same_sign(sun, saturn):
        h = _house_of(sun, chart)
        detail = f"Sun with Saturn in {sun['sign']} (house {h})"
        push_sign("Sun + Saturn", [sun["sign"]], detail)
        push_house(_house_combo_in_house("Sun + Saturn", h), h, sun["sign"], detail)

    # ── Sign-wise: Sun in Leo (D1) but weak in D-9 and/or D-12 ───────────
    if sun and sun.get("sign") == "Leo":
        weak_parts: list[str] = []
        for n, label in ((9, "D-9"), (12, "D-12")):
            weak, vsign = _sun_weak_in_varga(by, n)
            if weak and vsign:
                weak_parts.append(f"{label} ({vsign})")
        if weak_parts:
            push_sign(
                SUN_WEAK_VARGA_COMBO,
                ["Leo"],
                f"Sun in Leo (D1), weak in {', '.join(weak_parts)}",
            )

    # ── House-wise: Rahu / Ketu in sensitive houses (no sign lookup) ───────
    if rahu:
        h = _house_of(rahu, chart)
        detail = f"Rahu in {_ordinal(h)} house"
        if h == 9:
            push_house("Rahu in 9th", h, rahu["sign"], detail)
            push_sign(NODE_9TH_SIGN_COMBO, [rahu["sign"]], detail)
        elif h in (2, 5, 6, 8, 11, 12):
            push_house(f"Rahu in {_ordinal(h)}", h, rahu["sign"], detail)

    if ketu:
        h = _house_of(ketu, chart)
        detail = f"Ketu in {_ordinal(h)} house"
        if h == 9:
            push_house("Ketu in 9th", h, ketu["sign"], detail)
            push_sign(NODE_9TH_SIGN_COMBO, [ketu["sign"]], detail)
        elif h in (2, 5, 6, 8, 11, 12):
            push_house(f"Ketu in {_ordinal(h)}", h, ketu["sign"], detail)

    if rahu and ketu:
        rs, ks = str(rahu["sign"]), str(ketu["sign"])
        rh, kh = _house_of(rahu, chart), _house_of(ketu, chart)
        axis_detail = f"Rahu in {rs}, Ketu in {ks}"
        house_detail = (
            f"Rahu in {_ordinal(rh)} house, Ketu in {_ordinal(kh)} house"
        )
        _push_axis_sign(sign_findings, sign_keys, rs, ks, axis_detail)
        _push_axis_house(house_findings, house_keys, rh, kh, rs, ks, house_detail)

    # ── Sign-wise: planet afflictions by sign ───────────────────────────────
    if mars and _house_of(mars, chart) in (8, 9) and _is_afflicted_in_chart(mars, chart, by):
        h = _house_of(mars, chart)
        push_sign(
            "Afflicted Mars linked to 8th/9th",
            [mars["sign"]],
            f"Mars afflicted in {h}th house",
        )
    if mars and mars.get("sign") == "Scorpio" and _is_afflicted_in_chart(mars, chart, by):
        push_sign("Afflicted Mars", ["Scorpio"], "Afflicted Mars in Scorpio")

    if venus:
        if _is_afflicted_in_chart(venus, chart, by) and _afflicted_by_rahu_ketu_in_chart(venus, chart, by):
            push_sign(
                "Afflicted Venus with Rahu/Ketu",
                [venus["sign"]],
                "Venus afflicted by Rahu/Ketu conjunction or 7th drishti",
            )
        if venus.get("sign") == "Libra" and _is_afflicted_in_chart(venus, chart, by):
            push_sign("Afflicted Venus", ["Libra"], "Afflicted Venus in Libra")

    if mercury and _is_afflicted_in_chart(mercury, chart, by) and _afflicted_by_rahu_ketu_in_chart(mercury, chart, by):
        push_sign(
            "Mercury afflicted with Rahu/Ketu",
            [mercury["sign"]],
            "Mercury afflicted by Rahu/Ketu conjunction or 7th drishti",
        )
        if mercury.get("sign") == "Virgo":
            push_sign(
                "Mercury + Rahu/Ketu",
                ["Virgo"],
                "Mercury with nodes in Virgo",
            )

    if jupiter and _is_afflicted_in_chart(jupiter, chart, by) and jupiter["sign"] in (
        "Sagittarius",
        "Aquarius",
        "Pisces",
    ):
        push_sign(
            "Afflicted Jupiter",
            [jupiter["sign"]],
            "Jupiter afflicted (dusthana, nodes, or debilitation)",
        )

    if moon and moon.get("sign") == "Cancer" and _is_afflicted_in_chart(moon, chart, by):
        push_sign(
            "Saturn influence on Cancer Moon",
            ["Cancer"],
            "Saturn afflicts Moon in Cancer",
        )

    # ── House-wise: lord placements (from pitru_dosha_data) ─────────────────
    _detect_lord_placements(chart, by, push_house)

    # ── Sign-wise: 9th lord special cases ───────────────────────────────────
    lord9 = _house_lord(chart, 9, by)
    if lord9:
        lh = _house_of(lord9, chart)
        sign9 = _house_sign(chart, 9)
        if lh == 6 and sign9 == "Virgo":
            push_sign(
                "9th lord in Virgo dusthana",
                ["Virgo"],
                "9th lord in 6th (Virgo lagna 9th)",
            )
        if sign9 == "Capricorn" and lh in (6, 8, 12) and _is_afflicted_in_chart(lord9, chart, by):
            push_sign(
                "Afflicted 9th lord in Capricorn",
                ["Capricorn"],
                "9th lord from Capricorn 9th in dusthana (afflicted)",
            )

    # ── House-wise: graha afflictions (shared rules) ────────────────────────
    if sun:
        sh = _house_of(sun, chart)
        if sh == 4 and _is_afflicted_in_chart(sun, chart, by):
            push_house("Sun afflicted in 4th", 4, sun["sign"], "Sun afflicted in 4th house")
        if sh == 6 and _is_afflicted_in_chart(sun, chart, by):
            push_house("Sun afflicted in 6th", 6, sun["sign"], "Sun afflicted in 6th house")
        if sh == 9 and _is_afflicted_in_chart(sun, chart, by) and _afflicted_by_rahu_ketu_in_chart(sun, chart, by):
            push_house(
                "Sun afflicted by Rahu/Ketu in 9th house",
                9,
                sun["sign"],
                "Sun afflicted by Rahu/Ketu in 9th house",
            )

    if mars:
        mh = _house_of(mars, chart)
        if mh in (7, 8) and _is_afflicted_in_chart(mars, chart, by):
            push_house(
                "Mars afflicted in 7th/8th House",
                mh,
                mars["sign"],
                f"Mars afflicted in {mh}th house",
            )

    if venus:
        vh = _house_of(venus, chart)
        if vh == 7 and _is_afflicted_in_chart(venus, chart, by):
            push_house("Venus afflicted in 7th", 7, venus["sign"], "Venus afflicted in 7th house")
        if _is_afflicted_in_chart(venus, chart, by) and _afflicted_by_rahu_ketu_in_chart(venus, chart, by):
            push_general(
                "Venus afflicted with Rahu/Ketu",
                venus["sign"],
                "Venus afflicted by Rahu/Ketu conjunction or 7th drishti",
                house=vh,
            )

    if mercury:
        mrh = _house_of(mercury, chart)
        if mrh in (2, 7) and _is_afflicted_in_chart(mercury, chart, by):
            push_house(
                "Mercury afflicted in 2nd/7th House",
                mrh,
                mercury["sign"],
                f"Mercury afflicted in {mrh}th house",
            )
        if _is_afflicted_in_chart(mercury, chart, by) and _afflicted_by_rahu_ketu_in_chart(mercury, chart, by):
            push_general(
                "Mercury afflicted with Rahu/Ketu",
                mercury["sign"],
                "Mercury afflicted by Rahu/Ketu conjunction or 7th drishti",
                house=mrh,
            )

    if jupiter and _is_afflicted_in_chart(jupiter, chart, by) and _afflicted_by_rahu_ketu_in_chart(jupiter, chart, by):
        push_general(
            "Jupiter afflicted by Rahu/Ketu",
            jupiter["sign"],
            "Jupiter afflicted by Rahu/Ketu conjunction or 7th drishti",
            house=_house_of(jupiter, chart),
        )

    if saturn:
        sh = _house_of(saturn, chart)
        if sh == 2 and _is_afflicted_in_chart(saturn, chart, by):
            push_general(
                "Saturn in 2nd with affliction",
                saturn["sign"],
                "Saturn afflicted in 2nd house",
                house=sh,
            )

    # ── House-wise: Saturn in sensitive houses ─────────────────────────────
    if saturn:
        sh = _house_of(saturn, chart)
        if sh == 2:
            push_house("Saturn in 2nd", sh, saturn["sign"], "Saturn in 2nd house")
        if sh == 4:
            push_house("Saturn in 4th", sh, saturn["sign"], "Saturn in 4th house")
        if sh == 5:
            push_house("Saturn in 5th", sh, saturn["sign"], "Saturn in 5th house")

    return sign_findings, house_findings


def calculate_pitru_dosha(chart: dict) -> dict[str, Any]:
    by = _planets(chart)
    janma = _janma_rashi(chart)
    sign_findings, house_findings = _detect(chart)
    afflicted_planets = list_afflicted_planets(_by_for_affliction(chart, by))
    total = len(sign_findings) + len(house_findings)

    return {
        "janma_rashi": janma,
        "present": total > 0,
        "confirmation_count": total,
        "afflicted_planets": afflicted_planets,
        "sign_findings": sign_findings,
        "house_findings": house_findings,
        "disclaimer": (
            "Astrological reference only — not a medical diagnosis. "
            "Impacts apply only when chart matches the reference combination; "
            "Janma Rashi alone does not create Pitru Dosha."
        ),
    }
