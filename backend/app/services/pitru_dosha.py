"""
Pitru Dosha — strict Excel-based detection.

Sign-wise and house-wise are separate:
- Sign findings → Sign Wise Combos only (same-sign yogas, nodal sign-axis by Rahu/Ketu rashi).
- House findings → House Wise Combos only (planet in bhava, nodal house-axis by Rahu/Ketu bhava).
"""

from __future__ import annotations

from typing import Any

from app.data import pitru_dosha_data as ref
from app.services.varga import ZODIAC_SIGNS, varga_sign_index

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

DEBILITATION = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries",
}

AFFLICTORS = frozenset({"Rahu", "Ketu", "Saturn"})

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
        "Cancer": "Rahu/Ketu on Cancer-Capricorn axis",
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

# House-axis: anchor bhava → Excel combination (Rahu's house first; Ketu fallback).
AXIS_HOUSE_COMBO_BY_HOUSE: dict[frozenset[int], dict[int, str]] = {
    frozenset({1, 7}): {
        1: "Rahu/Ketu on 1st-7th axis",
        7: "Rahu/Ketu in 1st-7th axis",
    },
    frozenset({3, 9}): {3: "Rahu/Ketu in 3rd-9th axis"},
    frozenset({4, 10}): {
        4: "Rahu/Ketu in 4th-10th axis",
        10: "Rahu/Ketu in 4th-10th axis",
    },
    frozenset({5, 11}): {
        5: "Rahu/Ketu in 5th-11th axis",
        11: "Rahu/Ketu in 5th-11th axis",
    },
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


def _house_of(p: dict) -> int:
    return int(p.get("house") or 0)


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


def _afflicted(planet: dict, by: dict[str, dict]) -> bool:
    sign = planet.get("sign", "")
    pname = planet.get("name", "")
    for n in AFFLICTORS:
        o = by.get(n)
        if o and o.get("sign") == sign and n != pname:
            return True
    if DEBILITATION.get(pname) == sign:
        return True
    return False


def _house_sign(chart: dict, num: int) -> str:
    for h in chart.get("houses", []):
        if int(h.get("number", 0)) == num:
            return str(h.get("sign", "Aries"))
    return "Aries"


def _ninth_lord(chart: dict, by: dict[str, dict]) -> dict | None:
    lord = SIGN_LORDS.get(_house_sign(chart, 9))
    return by.get(lord) if lord else None


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
    """One house-wise axis card; display both Rahu and Ketu bhava."""
    pair = frozenset({rahu_house, ketu_house})
    by_house = AXIS_HOUSE_COMBO_BY_HOUSE.get(pair)
    if not by_house:
        return
    for anchor in (rahu_house, ketu_house):
        combo = by_house.get(anchor)
        if not combo:
            continue
        key = (combo, rahu_house, ketu_house)
        if key in house_keys:
            return
        row = _build_house_finding(combo, anchor, rahu_sign, detail)
        if row:
            row["rahu_sign"] = rahu_sign
            row["ketu_sign"] = ketu_sign
            row["rahu_house"] = rahu_house
            row["ketu_house"] = ketu_house
            house_keys.add(key)
            house_findings.append(row)
            return


def _build_house_finding(
    combination: str, house: int, planet_sign: str, detail: str
) -> dict | None:
    hr = ref.house_lookup(_house_label(house), combination)
    if not hr:
        return None
    return {
        "combination": combination,
        "house": house,
        "house_label": _house_label(house),
        "sign": planet_sign,
        "detail": detail,
        "house_wise_impact": hr["specific_impact"],
        "house_wise_severity": hr.get("severity") or None,
        "health_focus": hr["health_focus"],
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
    ) -> None:
        key = (combination, house)
        if key in house_keys:
            return
        row = _build_house_finding(combination, house, planet_sign, detail)
        if row:
            house_keys.add(key)
            house_findings.append(row)

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
            h = _house_of(a)
            detail = f"{label} in {a['sign']} (house {h})"
            push_sign(label, [a["sign"]], detail)
            push_house(_house_combo_in_house(label, h), h, a["sign"], detail)

    if sun and rahu and _same_sign(sun, rahu) and sun.get("sign") == "Libra":
        h = _house_of(sun)
        detail = "Debilitated Sun with Rahu in Libra"
        push_sign("Debilitated Sun + Rahu", ["Libra"], detail)
        push_house(_house_combo_in_house("Sun + Rahu", h), h, "Libra", detail)

    if sun and saturn and _same_sign(sun, saturn):
        h = _house_of(sun)
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
        h = _house_of(rahu)
        detail = f"Rahu in {_ordinal(h)} house"
        if h == 9:
            push_house("Rahu in 9th", h, rahu["sign"], detail)
            push_sign(NODE_9TH_SIGN_COMBO, [rahu["sign"]], detail)
        elif h in (2, 5, 6, 8, 11, 12):
            push_house(f"Rahu in {_ordinal(h)}", h, rahu["sign"], detail)

    if ketu:
        h = _house_of(ketu)
        detail = f"Ketu in {_ordinal(h)} house"
        if h == 9:
            push_house("Ketu in 9th", h, ketu["sign"], detail)
            push_sign(NODE_9TH_SIGN_COMBO, [ketu["sign"]], detail)
        elif h in (2, 5, 6, 8, 11, 12):
            push_house(f"Ketu in {_ordinal(h)}", h, ketu["sign"], detail)

    if rahu and ketu:
        rs, ks = str(rahu["sign"]), str(ketu["sign"])
        rh, kh = _house_of(rahu), _house_of(ketu)
        axis_detail = f"Rahu in {rs}, Ketu in {ks}"
        house_detail = (
            f"Rahu in {_ordinal(rh)} house, Ketu in {_ordinal(kh)} house"
        )
        _push_axis_sign(sign_findings, sign_keys, rs, ks, axis_detail)
        _push_axis_house(house_findings, house_keys, rh, kh, rs, ks, house_detail)

    # ── Sign-wise: planet afflictions by sign ───────────────────────────────
    if mars and _house_of(mars) in (8, 9) and _afflicted(mars, by):
        h = _house_of(mars)
        push_sign(
            "Afflicted Mars linked to 8th/9th",
            [mars["sign"]],
            f"Mars afflicted in {h}th house",
        )
    if mars and mars.get("sign") == "Scorpio" and _afflicted(mars, by):
        push_sign("Afflicted Mars", ["Scorpio"], "Afflicted Mars in Scorpio")

    if venus:
        h = _house_of(venus)
        if rahu and _same_sign(venus, rahu):
            push_sign(
                "Afflicted Venus with Rahu/Ketu",
                [venus["sign"]],
                "Venus conjunct Rahu (same sign)",
            )
        if ketu and _same_sign(venus, ketu):
            push_sign(
                "Afflicted Venus with Rahu/Ketu",
                [venus["sign"]],
                "Venus conjunct Ketu (same sign)",
            )
        if venus.get("sign") == "Libra" and _afflicted(venus, by):
            push_sign("Afflicted Venus", ["Libra"], "Afflicted Venus in Libra")

    if mercury and rahu and _same_sign(mercury, rahu):
        push_sign(
            "Mercury afflicted with Rahu/Ketu",
            [mercury["sign"]],
            "Mercury conjunct Rahu (same sign)",
        )
        if mercury.get("sign") == "Virgo":
            push_sign(
                "Mercury + Rahu/Ketu",
                ["Virgo"],
                "Mercury with nodes in Virgo",
            )
    if mercury and ketu and _same_sign(mercury, ketu):
        push_sign(
            "Mercury afflicted with Rahu/Ketu",
            [mercury["sign"]],
            "Mercury conjunct Ketu (same sign)",
        )

    if jupiter and _afflicted(jupiter, by) and jupiter["sign"] in (
        "Sagittarius",
        "Aquarius",
        "Pisces",
    ):
        push_sign(
            "Afflicted Jupiter",
            [jupiter["sign"]],
            "Jupiter afflicted by node/Saturn or debilitated",
        )

    if moon and moon.get("sign") == "Cancer" and _afflicted(moon, by):
        push_sign(
            "Saturn influence on Cancer Moon",
            ["Cancer"],
            "Saturn afflicts Moon in Cancer",
        )

    # ── House-wise: 9th lord in dusthana ───────────────────────────────────
    lord9 = _ninth_lord(chart, by)
    if lord9:
        lh = _house_of(lord9)
        ls = lord9["sign"]
        sign9 = _house_sign(chart, 9)
        if lh == 6:
            if sign9 == "Virgo":
                push_sign(
                    "9th lord in Virgo dusthana",
                    ["Virgo"],
                    "9th lord in 6th (Virgo lagna 9th)",
                )
            push_house("9th lord in 6th", 6, ls, "9th lord in 6th house")
        if lh == 8:
            push_house("9th lord in 8th afflicted", 8, ls, "9th lord in 8th house")
        if lh == 12:
            push_house("9th lord in 12th afflicted", 12, ls, "9th lord in 12th house")
        if lh == 1 and _afflicted(lord9, by):
            push_house(
                "Afflicted 9th lord in 1st", 1, ls, "9th lord in 1st house (afflicted)"
            )
        if sign9 == "Capricorn" and lh in (6, 8, 12):
            push_sign(
                "Afflicted 9th lord in Capricorn",
                ["Capricorn"],
                "9th lord from Capricorn 9th in dusthana",
            )

    # ── House-wise: Saturn in sensitive houses ─────────────────────────────
    if saturn:
        sh = _house_of(saturn)
        if sh == 2:
            push_house("Saturn in 2nd", sh, saturn["sign"], "Saturn in 2nd house")
        if sh == 4:
            push_house("Saturn in 4th", sh, saturn["sign"], "Saturn in 4th house")
        if sh == 5:
            push_house("Saturn in 5th", sh, saturn["sign"], "Saturn in 5th house")

    return sign_findings, house_findings


def calculate_pitru_dosha(chart: dict) -> dict[str, Any]:
    janma = _janma_rashi(chart)
    sign_findings, house_findings = _detect(chart)
    total = len(sign_findings) + len(house_findings)

    return {
        "janma_rashi": janma,
        "present": total > 0,
        "confirmation_count": total,
        "sign_findings": sign_findings,
        "house_findings": house_findings,
        "disclaimer": (
            "Astrological reference only — not a medical diagnosis. "
            "Impacts apply only when chart matches the reference combination; "
            "Janma Rashi alone does not create Pitru Dosha."
        ),
    }
