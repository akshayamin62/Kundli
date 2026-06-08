"""
Parashari yoga detection — Raja Yoga, Pancha Mahapurusha, shared chart primitives.
Used by Kaal Sarpa mitigating-factor analysis (D1, Whole Sign).
"""

from __future__ import annotations

from typing import Any

from app.services.varga import ZODIAC_SIGNS

SIGN_LORDS: dict[str, str] = {
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

OWN_SIGNS: dict[str, frozenset[str]] = {
    "Sun": frozenset({"Leo"}),
    "Moon": frozenset({"Cancer"}),
    "Mars": frozenset({"Aries", "Scorpio"}),
    "Mercury": frozenset({"Gemini", "Virgo"}),
    "Jupiter": frozenset({"Sagittarius", "Pisces"}),
    "Venus": frozenset({"Taurus", "Libra"}),
    "Saturn": frozenset({"Capricorn", "Aquarius"}),
}

EXALTATION: dict[str, str] = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mars": "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus": "Pisces",
    "Saturn": "Libra",
}

DEBILITATION: dict[str, str] = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mars": "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus": "Virgo",
    "Saturn": "Aries",
}

KENDRA = frozenset({1, 4, 7, 10})
TRIKONA = frozenset({1, 5, 9})
UPACHAYA = frozenset({3, 6, 10, 11})
DUSTHANA = frozenset({6, 8, 12})
BENEFICS = frozenset({"Jupiter", "Venus", "Mercury", "Moon"})
MALEFICS = frozenset({"Mars", "Saturn", "Rahu", "Ketu", "Sun"})
AFFLICTORS = frozenset({"Rahu", "Ketu", "Saturn"})

COMBUST_ORB: dict[str, float] = {
    "Moon": 12.0,
    "Mars": 17.0,
    "Mercury": 14.0,
    "Jupiter": 11.0,
    "Venus": 10.0,
    "Saturn": 15.0,
}

MAHAPURUSHA_RULES: dict[str, tuple[str, frozenset[str]]] = {
    "Mars": ("Ruchaka", frozenset({"Aries", "Scorpio", "Capricorn"})),
    "Mercury": ("Bhadra", frozenset({"Gemini", "Virgo"})),
    "Jupiter": ("Hamsa", frozenset({"Sagittarius", "Pisces", "Cancer"})),
    "Venus": ("Malavya", frozenset({"Taurus", "Libra", "Pisces"})),
    "Saturn": ("Shasha", frozenset({"Capricorn", "Aquarius", "Libra"})),
}

SEVERITY_LEVELS = ["Very High", "High", "Moderate", "Low", "Mitigated", "Strongly Mitigated"]


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
    return str(chart.get("angles", {}).get("ascendant", {}).get("sign", "Aries"))


def _sign_of_house(chart: dict, house: int) -> str:
    asc = _asc_sign(chart)
    idx = ZODIAC_SIGNS.index(asc)
    return ZODIAC_SIGNS[(idx + house - 1) % 12]


def _lord_of_house(chart: dict, house: int) -> str:
    return SIGN_LORDS[_sign_of_house(chart, house)]


def _planet_of_lord(chart: dict, house: int, by: dict[str, dict]) -> dict | None:
    lord = _lord_of_house(chart, house)
    return by.get(lord)


def _houses_ruled_by(chart: dict, planet_name: str) -> list[int]:
    ruled: list[int] = []
    for h in range(1, 13):
        if _lord_of_house(chart, h) == planet_name:
            ruled.append(h)
    return ruled


def _same_sign(a: dict, b: dict) -> bool:
    return a.get("sign") == b.get("sign")


def _in_own_or_exalt(planet: dict) -> bool:
    name = planet.get("name", "")
    sign = planet.get("sign", "")
    if sign in OWN_SIGNS.get(name, frozenset()):
        return True
    return EXALTATION.get(name) == sign


def _is_debilitated(planet: dict) -> bool:
    return DEBILITATION.get(planet.get("name", "")) == planet.get("sign", "")


def _angular_distance(lon_a: float, lon_b: float) -> float:
    d = abs(lon_a - lon_b) % 360.0
    return min(d, 360.0 - d)


def _is_combust(planet: dict, by: dict[str, dict]) -> bool:
    name = planet.get("name", "")
    if name not in COMBUST_ORB:
        return False
    sun = by.get("Sun")
    if not sun or planet.get("longitude") is None or sun.get("longitude") is None:
        return False
    if name == "Mercury" and planet.get("retrograde"):
        orb = 12.0
    else:
        orb = COMBUST_ORB[name]
    return _angular_distance(float(planet["longitude"]), float(sun["longitude"])) <= orb


def is_afflicted(planet: dict, by: dict[str, dict]) -> bool:
    sign = planet.get("sign", "")
    pname = planet.get("name", "")
    if _is_debilitated(planet):
        return True
    if _is_combust(planet, by):
        return True
    for n in AFFLICTORS:
        o = by.get(n)
        if o and o.get("sign") == sign and n != pname:
            return True
    return False


def _aspect_target_houses(from_house: int, planet_name: str) -> set[int]:
    def nth(n: int) -> int:
        return ((from_house - 1 + n - 1) % 12) + 1

    targets = {nth(3), nth(4), nth(5), nth(7), nth(8), nth(9), nth(10)}
    if planet_name == "Mars":
        targets.add(nth(4))
        targets.add(nth(8))
    elif planet_name == "Jupiter":
        targets.add(nth(5))
        targets.add(nth(9))
    elif planet_name == "Saturn":
        targets.add(nth(3))
        targets.add(nth(10))
    return targets


def _aspects(from_p: dict, to_house: int) -> bool:
    fh = int(from_p.get("house") or 0)
    if fh < 1:
        return False
    return to_house in _aspect_target_houses(fh, from_p.get("name", ""))


def _mutual_aspect(a: dict, b: dict) -> bool:
    return _aspects(a, int(b.get("house") or 0)) and _aspects(b, int(a.get("house") or 0))


def _parivartana(lord_a: dict, lord_b: dict, house_a: int, house_b: int, chart: dict) -> bool:
    return (
        lord_a.get("sign") == _sign_of_house(chart, house_b)
        and lord_b.get("sign") == _sign_of_house(chart, house_a)
    )


def _connection_type(
    lord_a: dict, lord_b: dict, house_a: int, house_b: int, chart: dict
) -> str | None:
    if _same_sign(lord_a, lord_b):
        return "yuti"
    if _parivartana(lord_a, lord_b, house_a, house_b, chart):
        return "parivartana"
    if _mutual_aspect(lord_a, lord_b):
        return "mutual_drishti"
    if _aspects(lord_a, int(lord_b.get("house") or 0)) or _aspects(
        lord_b, int(lord_a.get("house") or 0)
    ):
        return "single_drishti"
    return None


def _yoga_strength(planet: dict, by: dict[str, dict]) -> str:
    if is_afflicted(planet, by):
        return "weak"
    if _in_own_or_exalt(planet):
        return "strong"
    house = int(planet.get("house") or 0)
    if house in DUSTHANA:
        return "weak"
    return "moderate"


def detect_mahapurusha_yogas(by: dict[str, dict]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for planet_name, (yoga_name, qualifying) in MAHAPURUSHA_RULES.items():
        p = by.get(planet_name)
        if not p:
            continue
        house = int(p.get("house") or 0)
        sign = p.get("sign", "")
        if house not in KENDRA or sign not in qualifying:
            continue
        dignity = "exaltation" if EXALTATION.get(planet_name) == sign else "own_sign"
        strength = _yoga_strength(p, by)
        findings.append(
            {
                "yoga": yoga_name,
                "planet": planet_name,
                "house": house,
                "sign": sign,
                "dignity": dignity,
                "afflicted": is_afflicted(p, by),
                "strength": strength,
            }
        )
    return findings


def _raja_yoga_dedup_key(yoga_name: str, lords: list[str], connection: str) -> str:
    """One chart yoga per lord-pair + connection + name (not per kendra/trikona house pair)."""
    return f"{yoga_name}|{connection}|{'-'.join(sorted(lords))}"


def _raja_pair_priority(kendra_h: int, trikona_h: int, yoga_name: str) -> int:
    """Lower is better when merging duplicate lord-pair detections."""
    if yoga_name == "Dharma-Karmadhipati Yoga" and kendra_h == 10 and trikona_h == 9:
        return 0
    if yoga_name == "Lagnadhipati Raja Yoga" and kendra_h == 1:
        return 1
    return 10 + kendra_h


def detect_raja_yogas(chart: dict) -> list[dict[str, Any]]:
    by = _planets(chart)
    findings: list[dict[str, Any]] = []
    by_key: dict[str, dict[str, Any]] = {}

    def add(
        yoga_name: str,
        kendra_h: int,
        trikona_h: int,
        lords: list[str],
        connection: str,
        afflicted: bool,
        strength: str,
    ) -> None:
        key = _raja_yoga_dedup_key(yoga_name, lords, connection)
        entry = {
            "yoga_name": yoga_name,
            "kendra_house": kendra_h,
            "trikona_house": trikona_h,
            "lords": lords,
            "connection": connection,
            "afflicted": afflicted,
            "strength": strength,
        }
        existing = by_key.get(key)
        if existing is None:
            by_key[key] = entry
            return
        # Same physical yoga via another kendra×trikona pair — keep the higher-priority houses.
        if _raja_pair_priority(kendra_h, trikona_h, yoga_name) < _raja_pair_priority(
            existing["kendra_house"], existing["trikona_house"], existing["yoga_name"]
        ):
            by_key[key] = entry

    # Dual-lordship single-planet Raja Yoga
    for pname in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"):
        ruled = _houses_ruled_by(chart, pname)
        kendra_ruled = [h for h in ruled if h in KENDRA]
        trikona_ruled = [h for h in ruled if h in TRIKONA]
        if not kendra_ruled or not trikona_ruled:
            continue
        p = by.get(pname)
        if not p:
            continue
        ph = int(p.get("house") or 0)
        if ph not in set(kendra_ruled) | set(trikona_ruled):
            continue
        aff = is_afflicted(p, by)
        if _is_debilitated(p):
            continue
        strg = "strong" if _in_own_or_exalt(p) and not aff else "moderate"
        if aff:
            strg = "weak"
        add(
            "Single-lord Raja Yoga",
            kendra_ruled[0],
            trikona_ruled[0],
            [pname],
            "dual_lordship",
            aff,
            strg,
        )

    kendra_houses = [1, 4, 7, 10]
    trikona_houses = [5, 9]

    for k in kendra_houses:
        for t in trikona_houses:
            lord_k = _planet_of_lord(chart, k, by)
            lord_t = _planet_of_lord(chart, t, by)
            if not lord_k or not lord_t:
                continue
            if lord_k.get("name") == lord_t.get("name"):
                continue
            conn = _connection_type(lord_k, lord_t, k, t, chart)
            if not conn:
                continue
            aff = is_afflicted(lord_k, by) or is_afflicted(lord_t, by)
            if aff:
                strg = "weak"
            elif conn in ("parivartana", "mutual_drishti", "yuti"):
                strg = "strong"
            else:
                strg = "moderate"
            yoga_name = "Raja Yoga"
            if k == 10 and t == 9:
                yoga_name = "Dharma-Karmadhipati Yoga"
            elif k == 1:
                yoga_name = "Lagnadhipati Raja Yoga"
            add(
                yoga_name,
                k,
                t,
                [lord_k["name"], lord_t["name"]],
                conn,
                aff,
                strg,
            )

    return list(by_key.values())


def _strong_raja_for_mitigation(raja_yogas: list[dict]) -> list[dict]:
    good: list[dict] = []
    for y in raja_yogas:
        if y.get("afflicted"):
            continue
        if y.get("strength") in ("moderate", "strong", "very_strong"):
            good.append(y)
    return good


def _format_raja_detail(yogas: list[dict]) -> str:
    if not yogas:
        return "None"
    parts: list[str] = []
    for y in yogas[:3]:
        lords = " + ".join(y.get("lords", []))
        parts.append(f"{y.get('yoga_name', 'Raja Yoga')} ({lords}, {y.get('connection', '')})")
    if len(yogas) > 3:
        parts.append(f"+{len(yogas) - 3} more")
    return "; ".join(parts)


def _reduce_severity(base: str, steps: int) -> str:
    base_norm = base.replace("Moderate–High", "Moderate").replace("Moderate-High", "Moderate")
    try:
        idx = SEVERITY_LEVELS.index(base_norm)
    except ValueError:
        idx = 1
    new_idx = min(idx + steps, len(SEVERITY_LEVELS) - 1)
    return SEVERITY_LEVELS[new_idx]


def evaluate_mitigations(chart: dict) -> tuple[list[dict[str, Any]], str]:
    """Return mitigating_factors list and effective_severity."""
    by = _planets(chart)
    factors: list[dict[str, Any]] = []

    raja_yogas = detect_raja_yogas(chart)
    strong_raja = _strong_raja_for_mitigation(raja_yogas)
    m2_matched = len(strong_raja) >= 1
    m2_strength = "none"
    if any(y.get("yoga_name") == "Dharma-Karmadhipati Yoga" for y in strong_raja):
        m2_strength = "strong"
    elif len(strong_raja) >= 2:
        m2_strength = "very_strong"
    elif m2_matched:
        m2_strength = "moderate"

    factors.append(
        {
            "factor": "Strong Raja Yogas",
            "matched": m2_matched,
            "detail": _format_raja_detail(strong_raja if m2_matched else raja_yogas),
            "weight": "very_high",
            "severity_reduction": "significant" if m2_matched else "none",
            "raja_yogas": raja_yogas,
        }
    )

    mahapurushas = detect_mahapurusha_yogas(by)
    strong_mp = [m for m in mahapurushas if m.get("strength") != "weak"]
    # "Multiple" = 2 or more strong (non-weak, unafflicted) Mahapurusha yogas.
    m3_matched = len(strong_mp) >= 2
    if m3_matched:
        mp_detail = " + ".join(m["yoga"] for m in strong_mp)
    elif mahapurushas:
        mp_detail = (
            f"{len(mahapurushas)} yoga(s) found ({', '.join(m['yoga'] for m in mahapurushas)}) "
            f"— need 2+ strong (non-afflicted) for mitigation"
        )
    else:
        mp_detail = "None"
    factors.append(
        {
            "factor": "Multiple Mahapurusha Yogas",
            "matched": m3_matched,
            "detail": mp_detail,
            "weight": "very_high",
            "severity_reduction": "significant" if m3_matched else "none",
            "mahapurusha_yogas": mahapurushas,
        }
    )

    # M1 — Strong Jupiter
    jup = by.get("Jupiter")
    m1_matched = False
    m1_detail = "Jupiter not strong"
    if jup:
        jh = int(jup.get("house") or 0)
        jup_strong = (
            jh in KENDRA | TRIKONA
            or _in_own_or_exalt(jup)
            or (
                by.get("Rahu")
                and _aspects(jup, int(by["Rahu"].get("house") or 0))
            )
            or (
                by.get("Ketu")
                and _aspects(jup, int(by["Ketu"].get("house") or 0))
            )
        )
        m1_matched = jup_strong and not is_afflicted(jup, by)
        if m1_matched:
            m1_detail = f"Jupiter in {jh}th house, {jup.get('sign', '')}"
    factors.append(
        {
            "factor": "Strong Jupiter",
            "matched": m1_matched,
            "detail": m1_detail,
            "weight": "high",
            "severity_reduction": "moderate" if m1_matched else "none",
        }
    )

    # M4 — Strong Lagna
    lagna_lord_name = _lord_of_house(chart, 1)
    lagna_lord = by.get(lagna_lord_name)
    m4_matched = False
    m4_detail = "Lagna lord not strong"
    if lagna_lord:
        lh = int(lagna_lord.get("house") or 0)
        asc_sign = _asc_sign(chart)
        malefics_in_lagna = any(
            by.get(m) and by[m].get("sign") == asc_sign for m in ("Mars", "Saturn", "Rahu", "Ketu", "Sun")
        )
        m4_matched = (
            _in_own_or_exalt(lagna_lord)
            and lh in KENDRA | TRIKONA
            and not is_afflicted(lagna_lord, by)
            and not malefics_in_lagna
        )
        if m4_matched:
            m4_detail = f"Lagna lord {lagna_lord_name} in {lagna_lord.get('sign')} (house {lh})"
    factors.append(
        {
            "factor": "Strong Lagna",
            "matched": m4_matched,
            "detail": m4_detail,
            "weight": "very_high",
            "severity_reduction": "significant" if m4_matched else "none",
        }
    )

    # M5 — Strong Moon
    moon = by.get("Moon")
    m5_matched = False
    m5_detail = "Moon not strong"
    if moon:
        mh = int(moon.get("house") or 0)
        moon_ok = (
            _in_own_or_exalt(moon)
            and mh in KENDRA | TRIKONA
            and not any(
                by.get(n) and _same_sign(moon, by[n]) for n in ("Rahu", "Ketu", "Saturn")
            )
            and not is_afflicted(moon, by)
        )
        m5_matched = moon_ok
        if m5_matched:
            m5_detail = f"Moon in {moon.get('sign')} (house {mh})"
    factors.append(
        {
            "factor": "Strong Moon",
            "matched": m5_matched,
            "detail": m5_detail,
            "weight": "very_high",
            "severity_reduction": "significant" if m5_matched else "none",
        }
    )

    # M6 — Strong 9th & 10th houses
    lord_9 = _planet_of_lord(chart, 9, by)
    lord_10 = _planet_of_lord(chart, 10, by)
    benefics_9_10 = sum(
        1
        for h in (9, 10)
        for b in BENEFICS
        if (p := by.get(b)) and int(p.get("house") or 0) == h and not is_afflicted(p, by)
    )
    lords_strong = (
        lord_9 is not None
        and lord_10 is not None
        and _in_own_or_exalt(lord_9)
        and _in_own_or_exalt(lord_10)
        and not is_afflicted(lord_9, by)
        and not is_afflicted(lord_10, by)
    )
    m6_matched = lords_strong or benefics_9_10 >= 2
    m6_detail = (
        f"9th lord {_lord_of_house(chart, 9)}, 10th lord {_lord_of_house(chart, 10)} strong"
        if lords_strong
        else (f"Benefics in 9th/10th ({benefics_9_10})" if benefics_9_10 >= 2 else "9th/10th not strong")
    )
    factors.append(
        {
            "factor": "Strong 9th & 10th houses",
            "matched": m6_matched,
            "detail": m6_detail,
            "weight": "very_high",
            "severity_reduction": "significant" if m6_matched else "none",
        }
    )

    # M7 — Rahu in Upachaya
    rahu = by.get("Rahu")
    m7_matched = bool(rahu and int(rahu.get("house") or 0) in UPACHAYA)
    factors.append(
        {
            "factor": "Rahu in Upachaya",
            "matched": m7_matched,
            "detail": f"Rahu in house {rahu.get('house')}" if rahu else "—",
            "weight": "moderate",
            "severity_reduction": "moderate" if m7_matched else "none",
        }
    )

    # M8 — D-9 note (informational)
    from app.services.varga import varga_sign_index

    d9_present = _kaal_sarpa_d9_note(chart, by, varga_sign_index)
    factors.append(
        {
            "factor": "D-9 Kaal Sarpa note",
            "matched": False,  # informational only — never a mitigation
            "detail": (
                "Navamsa also shows Kaal Sarpa (informational)"
                if d9_present
                else "Navamsa does not repeat Kaal Sarpa (informational)"
            ),
            "weight": "low",
            "severity_reduction": "none",
            "informational": True,
            "navamsa_repeats": d9_present,
        }
    )

    return factors, m2_strength


def _sign_in_arc(sign: str, start_sign: str, end_sign: str) -> bool:
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


_TARA_GRAHAS = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")


def _kaal_sarpa_d9_note(chart: dict, by: dict[str, dict], varga_sign_index) -> bool:
    """Informational: whether D-9 also has all grahas on one side of nodal axis."""
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not rahu or not ketu:
        return False

    def d9_sign(p: dict) -> str:
        lon = p.get("longitude")
        if lon is None:
            return ""
        return ZODIAC_SIGNS[varga_sign_index(float(lon), 9)]

    r9 = d9_sign(rahu)
    k9 = d9_sign(ketu)
    if not r9 or not k9:
        return False

    graha_signs = [d9_sign(by[g]) for g in _TARA_GRAHAS if g in by]
    if len(graha_signs) != 7:
        return False

    return _all_signs_in_arc(graha_signs, r9, k9) or _all_signs_in_arc(graha_signs, k9, r9)


def adjust_severity(base_severity: str, factors: list[dict], m2_strength: str) -> str:
    steps = 0
    very_high_count = sum(
        1 for f in factors if f.get("matched") and f.get("weight") == "very_high"
    )
    high_count = sum(1 for f in factors if f.get("matched") and f.get("weight") == "high")
    mod_count = sum(1 for f in factors if f.get("matched") and f.get("weight") == "moderate")

    if m2_strength == "very_strong":
        steps += 2
    elif m2_strength == "strong":
        steps += 1

    if very_high_count >= 3:
        steps += 2
    elif very_high_count >= 2:
        steps += 1

    steps += min(high_count, 1)
    if mod_count >= 2:
        steps += 1

    if very_high_count >= 3 and m2_strength in ("strong", "very_strong"):
        return "Strongly Mitigated"

    result = _reduce_severity(base_severity, steps)
    if steps >= 2:
        return "Mitigated" if result not in ("Strongly Mitigated",) else result
    return result
