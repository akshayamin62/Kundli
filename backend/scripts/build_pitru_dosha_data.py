"""Regenerate pitru_dosha_data.py from Excel (+ severity from House Matrix & Dosha Matrix)."""
import os
import re

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
XLSX_MAIN = os.path.join(ROOT, "Pitru_Dosha_Zodiac_House_Wise_Combinations.xlsx")
XLSX_DOSHA = os.path.join(ROOT, "Pitru_Dosha_Health_and_Modern_Solutions.xlsx")
OUT = os.path.join(ROOT, "backend", "app", "data", "pitru_dosha_data.py")

# Sign Wise combination → Dosha Matrix severity (same for every zodiac sign row).
SIGN_COMBINATION_SEVERITY: dict[str, str] = {
    "Sun + Rahu": "High",
    "Sun + Ketu": "Medium-High",
    "Saturn + Rahu": "Very High",
    "Saturn + Ketu": "High",
    "Moon + Rahu": "Medium-High",
    "Moon + Ketu": "Medium-High",
    "Debilitated Sun + Rahu": "High",
    "Rahu/Ketu affecting 9th": "High",
    "Rahu/Ketu in Taurus-Scorpio axis": "Very High",
    "Rahu/Ketu in Gemini-Sagittarius axis": "High",
    "Rahu/Ketu on Cancer-Capricorn axis": "Medium",
    "Rahu/Ketu in Cancer-Capricorn axis": "Medium",
    "Rahu/Ketu in Libra-Aries axis": "Medium-High",
    "Rahu/Ketu in Virgo-Pisces axis": "High",
    "Mercury afflicted with Rahu/Ketu": "Medium-High",
    "Mercury + Rahu/Ketu": "High",
    "Afflicted Venus with Rahu/Ketu": "Medium-High",
    "Afflicted Venus": "Medium-High",
    "Afflicted Mars": "Medium-High",
    "Afflicted Mars linked to 8th/9th": "Very High",
    "Afflicted Jupiter": "Medium-High",
    "9th lord in Virgo dusthana": "High",
    "Afflicted 9th lord in Capricorn": "High",
    "Saturn aspect on Sun": "High",
    "Saturn influence on Cancer Moon": "Medium-High",
    "Rahu/Ketu affecting Leo 5th": "High",
    "Sun weak in D-9/D-12 despite Leo placement": "Medium-High",
}

# House Wise combination → Dosha Matrix severity (when listed); else House Severity Matrix.
HOUSE_COMBINATION_SEVERITY: dict[str, str] = {
    "Sun + Rahu in 1st": "High",
    "Sun + Rahu in 3rd": "High",
    "Sun + Rahu in 5th": "High",
    "Sun + Rahu in 7th": "High",
    "Sun + Rahu in 8th": "High",
    "Sun + Rahu in 9th": "High",
    "Sun + Rahu in 10th": "High",
    "Sun + Rahu in 12th": "High",
    "Sun + Ketu in 1st": "Medium-High",
    "Sun + Ketu in 8th": "High",
    "Sun + Ketu in 12th": "Medium-High",
    "Sun + Saturn in 9th": "High",
    "Sun + Saturn in 10th": "High",
    "Rahu in 9th": "High",
    "Ketu in 9th": "Medium-High",
    "Rahu in 8th": "Very High",
    "Rahu in 2nd": "Medium-High",
    "Ketu in 2nd": "Medium-High",
    "Saturn in 2nd": "Medium-High",
    "Saturn in 4th": "Medium",
    "Saturn in 5th": "High",
    "9th lord in 6th": "High",
    "9th lord in 8th afflicted": "High",
    "9th lord in 12th afflicted": "High",
    "Afflicted 9th lord in 1st": "High",
    "9th lord afflicted": "High",
    "Gulika/Mandi in 9th": "High",
    "Rahu/Ketu on 1st-7th axis": "Medium-High",
    "Rahu/Ketu in 1st-7th axis": "Medium-High",
    "Rahu/Ketu in 3rd-9th axis": "High",
    "Rahu/Ketu in 4th-10th axis": "Medium",
    "Rahu/Ketu in 5th-11th axis": "Medium-High",
    "Saturn + Rahu in 1st": "Very High",
    "Saturn + Rahu in 3rd": "Very High",
    "Saturn + Rahu in 6th": "Very High",
    "Saturn + Rahu in 8th": "Very High",
    "Saturn + Rahu in 10th": "High",
    "Saturn + Ketu in 7th": "High",
    "Saturn + Ketu in 12th": "High",
    "Moon + Rahu in 4th": "Medium-High",
    "Moon + Ketu in 4th": "Medium-High",
    "Sun afflicted in 4th": "Medium",
    "Sun afflicted in 6th": "High",
    "2nd lord in 8th afflicted": "Very High",
    "5th lord in 8th afflicted": "High",
    "5th lord in 8th/12th afflicted": "High",
}

# Sign/house combination → Dosha Matrix type (for remedies lookup).
COMBINATION_TO_DOSHA_TYPE: dict[str, str] = {
    "Sun + Rahu": "Sun-Rahu Pitru Dosha",
    "Sun + Ketu": "Sun-Ketu Pitru Dosha",
    "Sun + Saturn": "Sun-Saturn Pitru Dosha",
    "Moon + Rahu": "Moon-Rahu Ancestral Mental Dosha",
    "Moon + Ketu": "Moon-Ketu Emotional Detachment",
    "Saturn + Rahu": "Saturn-Rahu Ancestral Curse Type",
    "Saturn + Ketu": "Saturn-Ketu Ancestral Separation",
    "Debilitated Sun + Rahu": "Sun-Rahu Pitru Dosha",
    "Rahu/Ketu affecting 9th": "Rahu in 9th House",
    "Rahu in 9th": "Rahu in 9th House",
    "Ketu in 9th": "Ketu in 9th House",
    "Rahu in 8th": "Afflicted 8th House Lineage Dosha",
    "Rahu in 2nd": "Pitru Dosha through 2nd House",
    "Ketu in 2nd": "Pitru Dosha through 2nd House",
    "Saturn in 2nd": "Pitru Dosha through 2nd House",
    "Saturn in 4th": "Pitru Dosha through 4th House",
    "Saturn in 5th": "Afflicted 5th House",
    "9th lord in 6th": "Afflicted 9th Lord",
    "9th lord in 8th afflicted": "Afflicted 9th Lord",
    "9th lord in 12th afflicted": "Afflicted 9th Lord",
    "Afflicted 9th lord in 1st": "Afflicted 9th Lord",
    "9th lord afflicted": "Afflicted 9th Lord",
    "Afflicted 9th lord in Capricorn": "Afflicted 9th Lord",
    "9th lord in Virgo dusthana": "Afflicted 9th Lord",
    "Gulika/Mandi in 9th": "Gulika/Mandi Pitru Dosha",
    "Rahu/Ketu in Taurus-Scorpio axis": "Rahu/Ketu Axis in 2nd-8th",
    "Rahu/Ketu in Gemini-Sagittarius axis": "Rahu/Ketu Axis in 3rd-9th",
    "Rahu/Ketu on Cancer-Capricorn axis": "Rahu/Ketu Axis in 4th-10th",
    "Rahu/Ketu in Cancer-Capricorn axis": "Rahu/Ketu Axis in 4th-10th",
    "Rahu/Ketu in Libra-Aries axis": "Rahu/Ketu Axis in 1st-7th",
    "Rahu/Ketu in Virgo-Pisces axis": "Rahu/Ketu Axis in 6th-12th",
    "Rahu/Ketu on 1st-7th axis": "Rahu/Ketu Axis in 1st-7th",
    "Rahu/Ketu in 1st-7th axis": "Rahu/Ketu Axis in 1st-7th",
    "Rahu/Ketu in 3rd-9th axis": "Rahu/Ketu Axis in 3rd-9th",
    "Rahu/Ketu in 4th-10th axis": "Rahu/Ketu Axis in 4th-10th",
    "Rahu/Ketu in 5th-11th axis": "Rahu/Ketu Axis in 5th-11th",
    "Mercury afflicted with Rahu/Ketu": "Guru Chandal Yoga Pitru Link",
    "Mercury + Rahu/Ketu": "Guru Chandal Yoga Pitru Link",
    "Afflicted Venus with Rahu/Ketu": "Jupiter Afflicted Pitru Dosha",
    "Afflicted Venus": "Jupiter Afflicted Pitru Dosha",
    "Afflicted Mars linked to 8th/9th": "Sun-Mars Pitru Dosha",
    "Afflicted Mars": "Sun-Mars Pitru Dosha",
    "Afflicted Jupiter": "Jupiter Afflicted Pitru Dosha",
    "Saturn aspect on Sun": "Sun-Saturn Pitru Dosha",
    "Saturn influence on Cancer Moon": "Moon-Rahu Ancestral Mental Dosha",
    "Rahu/Ketu affecting Leo 5th": "Afflicted 5th House",
    "Sun weak in D-9/D-12 despite Leo placement": "D-9 Navamsa Pitru Indication",
    "2nd lord in 8th afflicted": "Pitru Dosha through 2nd House",
    "5th lord in 8th afflicted": "Afflicted 5th House",
    "5th lord in 8th/12th afflicted": "Afflicted 5th House",
    "Sun afflicted in 4th": "Pitru Dosha through 4th House",
    "Sun afflicted in 6th": "6th/8th/12th Link with Sun or 9th Lord",
}

PLANET_SPIRITUAL_DEFAULT: dict[str, str] = {
    "Sun": "Surya arghya, Sunday worship, respect for father and elders",
    "Moon": "Chandra puja, Monday rituals, mother-line healing",
    "Mars": "Hanuman worship, Tuesday fasting, courage through seva",
    "Mercury": "Vishnu worship, Wednesday prayers, honest speech",
    "Jupiter": "Guru seva, Thursday puja, dharma and pitru tarpan",
    "Venus": "Friday Lakshmi puja, harmony in relationships",
    "Saturn": "Saturday Shani puja, service to elders and poor",
    "Rahu": "Rahu shanti, ethical conduct, avoid shortcuts",
    "Ketu": "Ketu pacification, meditation, service to animals",
}

CONVENTIONAL_BY_DOSHA_TYPE: dict[str, str] = {
    "Sun-Rahu Pitru Dosha": "Pitru tarpan on Amavasya, Surya arghya, Rahu shanti, Shiva puja",
    "Sun-Ketu Pitru Dosha": "Pitru tarpan, Surya namaskar, Ketu peace rituals, ancestral remembrance",
    "Rahu in 9th House": "9th house peace puja, father-line tarpan, Thursday Guru worship",
    "Ketu in 9th House": "Ketu shanti, dharma seva, respect for guru and father",
    "Saturn-Rahu Ancestral Curse Type": "Shani-Rahu shanti, Saturday charity, Mahamrityunjaya japa",
    "Saturn-Ketu Ancestral Separation": "Ancestor tarpan, Ketu-Saturn peace rituals, elder seva",
    "Moon-Rahu Ancestral Mental Dosha": "Chandra shanti, Monday fasting, emotional healing prayers",
    "Moon-Ketu Emotional Detachment": "Chandra-Ketu peace, grounding sadhana, mother-line healing",
    "Jupiter Afflicted Pitru Dosha": "Guru puja, pitru tarpan, Thursday worship, dharma correction",
    "Guru Chandal Yoga Pitru Link": "Guru-Rahu/Ketu shanti, Vishnu sahasranama, ethical speech",
    "Afflicted 9th Lord": "9th lord peace rituals, father worship, pitru tarpan",
    "Afflicted 5th House": "Santan peace puja, 5th house remedies, Guru grace",
    "Afflicted 8th House Lineage Dosha": "8th house shanti, ancestral healing, Mahamrityunjaya japa",
    "Rahu/Ketu Axis in 2nd-8th": "Family lineage tarpan, 2nd-8th axis shanti, wealth dharma rituals",
    "Rahu/Ketu Axis in 3rd-9th": "Sibling and father-line peace, 3rd-9th axis remedies",
    "Rahu/Ketu Axis in 1st-7th": "Lagna shanti, marriage harmony puja, Rahu-Ketu axis peace",
    "Rahu/Ketu Axis in 4th-10th": "Griha shanti, career dharma rituals, mother-father balance",
    "Rahu/Ketu Axis in 5th-11th": "5th house Guru puja, progeny peace rituals",
    "Rahu/Ketu Axis in 6th-12th": "Health and moksha balance rituals, service to needy",
    "Pitru Dosha through 2nd House": "Family tarpan, speech discipline, 2nd house peace",
    "Pitru Dosha through 4th House": "Mother worship, griha shanti, 4th house remedies",
    "Pitru Dosha through 10th House": "Father and career dharma rituals, Sunday Surya puja",
    "Pitru Dosha through 12th House": "Moksha-oriented pitru seva, 12th house peace",
    "Gulika/Mandi Pitru Dosha": "Gulika shanti, Saturday remedies, ancestral peace",
    "Sun-Saturn Pitru Dosha": "Surya-Shani peace, Sunday-Saturday worship, father respect",
    "Sun-Mars Pitru Dosha": "Surya-Mangal shanti, Tuesday-Sunday rituals",
    "D-9 Navamsa Pitru Indication": "Navamsa peace puja, pitru tarpan, Guru worship",
    "6th/8th/12th Link with Sun or 9th Lord": "Dusthana shanti, health and pitru combined remedies",
}


def load_modern_solutions() -> dict[str, str]:
    wb = openpyxl.load_workbook(XLSX_DOSHA, read_only=True, data_only=True)
    ws = wb["Modern Solutions"]
    out: dict[str, str] = {}
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r and r[1] and r[3]:
            out[str(r[1]).strip()] = str(r[3]).strip()
    wb.close()
    return out


def resolve_dosha_type(combination: str) -> str | None:
    if combination in COMBINATION_TO_DOSHA_TYPE:
        return COMBINATION_TO_DOSHA_TYPE[combination]
    m = re.match(r"^(.+?) in \d+(?:st|nd|rd|th)?(?:\s+House)?$", combination, re.I)
    if m:
        base = m.group(1).strip()
        if base in COMBINATION_TO_DOSHA_TYPE:
            return COMBINATION_TO_DOSHA_TYPE[base]
    return None


def conventional_for(combination: str) -> str:
    dtype = resolve_dosha_type(combination)
    if dtype and dtype in CONVENTIONAL_BY_DOSHA_TYPE:
        return CONVENTIONAL_BY_DOSHA_TYPE[dtype]
    parts: list[str] = []
    for planet, text in PLANET_SPIRITUAL_DEFAULT.items():
        if planet in combination:
            parts.append(text)
    if parts:
        return "; ".join(dict.fromkeys(parts))
    return "Pitru tarpan on Amavasya, respect for ancestors, Shiva puja, ethical living"


def modern_for(combination: str, modern_map: dict[str, str]) -> str:
    dtype = resolve_dosha_type(combination)
    if dtype and dtype in modern_map:
        return modern_map[dtype]
    return (
        "Annual health screening as advised, family health history documentation, "
        "stress management, therapy when needed, ethical lifestyle corrections"
    )


def read_sheet(wb, name: str, header_row: int = 2) -> list[dict]:
    ws = wb[name]
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(h).strip() if h else "" for h in rows[header_row]]
    data = []
    for r in rows[header_row + 1 :]:
        if not r or all(c is None or str(c).strip() == "" for c in r):
            continue
        d = {
            headers[i]: (str(r[i]).strip() if r[i] is not None else "")
            for i in range(len(headers))
            if headers[i]
        }
        if any(d.values()):
            data.append(d)
    return data


def load_house_severity_matrix() -> dict[str, str]:
    wb = openpyxl.load_workbook(XLSX_MAIN, read_only=True, data_only=True)
    ws = wb["Severity Matrix"]
    out: dict[str, str] = {}
    for r in ws.iter_rows(min_row=4, values_only=True):
        if r and r[0] and r[2]:
            out[str(r[0]).strip()] = str(r[2]).strip()
    wb.close()
    return out


def house_label_to_ordinal(house_label: str) -> str:
    m = re.match(r"^(\d+)(?:st|nd|rd|th)\s+House$", house_label.strip(), re.I)
    if m:
        n = int(m.group(1))
        if 10 <= n % 100 <= 20:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
        return f"{n}{suffix}"
    return ""


def house_row_severity(house_label: str, combination: str, house_matrix: dict[str, str]) -> str:
    if combination in HOUSE_COMBINATION_SEVERITY:
        return HOUSE_COMBINATION_SEVERITY[combination]
    ordinal = house_label_to_ordinal(house_label)
    return house_matrix.get(ordinal, "")


def py_str(s: str) -> str:
    return repr(s)


def main() -> None:
    house_matrix = load_house_severity_matrix()
    modern_map = load_modern_solutions()

    wb = openpyxl.load_workbook(XLSX_MAIN, read_only=True, data_only=True)
    sign_rows = read_sheet(wb, "Sign Wise Combos")
    house_rows = read_sheet(wb, "House Wise Combos")
    wb.close()

    sign_wise = [
        {
            "sign": d["Zodiac Sign"],
            "combination": d["Combination in Sign"],
            "stronger_houses": d["Stronger House/Axis"],
            "general_impact": d["Health Impact"],
            "nature_theme": d["Nature/Theme"],
            "severity": SIGN_COMBINATION_SEVERITY.get(d["Combination in Sign"], ""),
            "conventional_remedies": conventional_for(d["Combination in Sign"]),
            "modern_remedies": modern_for(d["Combination in Sign"], modern_map),
        }
        for d in sign_rows
    ]

    house_wise = [
        {
            "house": d["House"],
            "combination": d["Combination"],
            "specific_impact": d["Impact"],
            "health_focus": d["Health Focus"],
            "severity": house_row_severity(d["House"], d["Combination"], house_matrix),
            "conventional_remedies": conventional_for(d["Combination"]),
            "modern_remedies": modern_for(d["Combination"], modern_map),
        }
        for d in house_rows
    ]

    lines = [
        '"""',
        "Pitru Dosha reference data (from Pitru_Dosha_Zodiac_House_Wise_Combinations.xlsx).",
        "Severity: Sign Wise from Dosha Matrix; House Wise from Dosha Matrix or House Severity Matrix.",
        "Regenerate: python backend/scripts/build_pitru_dosha_data.py",
        '"""',
        "",
        "from typing import TypedDict",
        "",
        "",
        "class SignWiseRow(TypedDict):",
        "    sign: str",
        "    combination: str",
        "    stronger_houses: str",
        "    general_impact: str",
        "    nature_theme: str",
        "    severity: str",
        "    conventional_remedies: str",
        "    modern_remedies: str",
        "",
        "",
        "class HouseWiseRow(TypedDict):",
        "    house: str",
        "    combination: str",
        "    specific_impact: str",
        "    health_focus: str",
        "    severity: str",
        "    conventional_remedies: str",
        "    modern_remedies: str",
        "",
        "",
        "SIGN_WISE: list[SignWiseRow] = [",
    ]

    for row in sign_wise:
        lines.append(
            "    {"
            f'"sign": {py_str(row["sign"])}, '
            f'"combination": {py_str(row["combination"])}, '
            f'"stronger_houses": {py_str(row["stronger_houses"])}, '
            f'"general_impact": {py_str(row["general_impact"])}, '
            f'"nature_theme": {py_str(row["nature_theme"])}, '
            f'"severity": {py_str(row["severity"])}, '
            f'"conventional_remedies": {py_str(row["conventional_remedies"])}, '
            f'"modern_remedies": {py_str(row["modern_remedies"])}, '
            "},"
        )

    lines.append("]")
    lines.append("")
    lines.append("HOUSE_WISE: list[HouseWiseRow] = [")

    for row in house_wise:
        lines.append(
            "    {"
            f'"house": {py_str(row["house"])}, '
            f'"combination": {py_str(row["combination"])}, '
            f'"specific_impact": {py_str(row["specific_impact"])}, '
            f'"health_focus": {py_str(row["health_focus"])}, '
            f'"severity": {py_str(row["severity"])}, '
            f'"conventional_remedies": {py_str(row["conventional_remedies"])}, '
            f'"modern_remedies": {py_str(row["modern_remedies"])}, '
            "},"
        )

    lines.append("]")
    lines.append("")
    lines.append("")
    lines.append("def sign_lookup(sign: str, combination: str) -> SignWiseRow | None:")
    lines.append("    for row in SIGN_WISE:")
    lines.append("        if row['sign'] == sign and row['combination'] == combination:")
    lines.append("            return row")
    lines.append("    return None")
    lines.append("")
    lines.append("")
    lines.append("def find_sign_row(")
    lines.append("    combination: str, signs: list[str]")
    lines.append(") -> tuple[SignWiseRow | None, str | None]:")
    lines.append("    for sign in signs:")
    lines.append("        row = sign_lookup(sign, combination)")
    lines.append("        if row:")
    lines.append("            return row, sign")
    lines.append("    return None, None")
    lines.append("")
    lines.append("")
    lines.append("def house_lookup(house_label: str, combination: str) -> HouseWiseRow | None:")
    lines.append("    for row in HOUSE_WISE:")
    lines.append("        if row['house'] == house_label and row['combination'] == combination:")
    lines.append("            return row")
    lines.append("    return None")
    lines.append("")
    lines.append("")
    lines.append("def combinations_for_sign(sign: str) -> list[str]:")
    lines.append("    return [r['combination'] for r in SIGN_WISE if r['sign'] == sign]")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    missing_sign = {r["combination"] for r in sign_wise if not r["severity"]}
    missing_house = {r["combination"] for r in house_wise if not r["severity"]}
    print(f"Wrote {OUT} ({len(sign_wise)} sign, {len(house_wise)} house rows)")
    if missing_sign:
        print("Sign combos without severity:", sorted(missing_sign))
    if missing_house:
        print("House combos without severity:", sorted(missing_house))


if __name__ == "__main__":
    main()
