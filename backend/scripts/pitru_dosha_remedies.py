"""Domain-wise conventional and modern remedies for Pitru Dosha house combinations."""
from __future__ import annotations

import re
from typing import Literal

from pitru_health_remedies_data import HEALTH_REMEDIES_BY_COMBINATION

Domain = Literal["health", "career", "finance", "relationship"]

PITRU_BASE = "Pitru tarpan on Amavasya, respect for ancestors, ethical living"

PLANET_CONVENTIONAL: dict[str, str] = {
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

HOUSE_CONVENTIONAL: dict[Domain, dict[int, str]] = {
    "health": {
        1: "Lagna shanti, vitality prayers, immunity strengthening rituals",
        2: "2nd house peace, speech discipline, family food-dharma rituals",
        3: "3rd house courage rituals, sibling-line healing",
        4: "Griha shanti, mother worship, emotional peace at home",
        5: "Santan peace puja, 5th house Guru grace rituals",
        6: "Dusthana shanti, disease-removal prayers, service to sick",
        7: "7th house harmony puja, partnership peace rituals",
        8: "8th house shanti, Mahamrityunjaya japa, ancestral healing",
        9: "9th house peace puja, father-line tarpan, Thursday Guru worship",
        10: "10th house dharma-karma balance, Sunday Surya for vitality at work",
        11: "11th house peace, social support and circulation rituals",
        12: "12th house moksha seva, sleep and hospital-karma prayers",
    },
    "career": {
        1: "Lagna strength rituals for professional identity and confidence",
        2: "Speech discipline for workplace reputation, family business dharma",
        3: "Courage and communication rituals for skills and initiative",
        4: "Griha shanti to balance home pressure with career growth",
        5: "Guru grace and strategic intelligence prayers",
        6: "Shani seva for service-sector karma, workplace obstacle removal",
        7: "Partnership ethics rituals, client and colleague harmony puja",
        8: "Sudden career-risk shanti, hidden-enemy protection rituals",
        9: "Father-line blessings, Guru worship, dharma-aligned career prayers",
        10: "Vishwakarma puja, Sunday Surya arghya, karma-yoga workplace rituals",
        11: "Networking dharma, ethical gains prayers, mentor blessings",
        12: "Foreign work protection, expense-control and burnout-release rituals",
    },
    "finance": {
        1: "Self-worth and wealth-confidence rituals",
        2: "2nd house Lakshmi peace, family wealth tarpan, truthful speech vows",
        3: "Communication ethics for business income, sibling wealth harmony",
        4: "Property and asset peace rituals, mother-line prosperity prayers",
        5: "Dhana-Lakshmi puja, disciplined investment blessings",
        6: "Debt-release prayers, loan and litigation wealth protection",
        7: "Partnership wealth agreements blessed through Shiva-Parvati puja",
        8: "Inheritance shanti, joint-asset and ancestral property rituals",
        9: "Fortune-line prayers, father blessings for righteous wealth",
        10: "Career-income dharma rituals, professional revenue stability puja",
        11: "Kubera-Lakshmi worship, gains through ethical networks",
        12: "Expense-control rituals, leakage prevention and savings blessings",
    },
    "relationship": {
        1: "Self-love and identity healing for healthier relating",
        2: "Family speech peace, sweet communication and food-sharing rituals",
        3: "Sibling harmony prayers, courage to express needs kindly",
        4: "Griha shanti, mother-line emotional healing, domestic peace",
        5: "Romance and progeny blessings, Santan and love-dharma puja",
        6: "Conflict-reduction rituals, criticism and blame-release prayers",
        7: "Uma-Maheshwara puja, 7th house marriage peace, spouse harmony rituals",
        8: "Intimacy and trust healing, in-law and secrecy-release shanti",
        9: "Elder blessings for marriage, dharma-aligned partner prayers",
        10: "Work-family boundary rituals to protect relationship time",
        11: "Friend-circle purification, social support and elder-sibling harmony",
        12: "Bed-peace and privacy rituals, separation-fear release prayers",
    },
}

DOMAIN_BASE_CONVENTIONAL: dict[Domain, str] = {
    "health": "Mahamrityunjaya japa when chronic or dusthana-linked, ancestral health tarpan",
    "career": "Karma-yoga seva, ethical profession vows, father and Guru blessings for work",
    "finance": "Lakshmi-Kubera Friday puja, righteous wealth vows, family lineage tarpan",
    "relationship": "Shiva-Parvati or Uma-Maheshwara puja, marriage dharma and elder blessings",
}

DOMAIN_BASE_MODERN: dict[Domain, str] = {
    "health": "Regular preventive check-ups, family medical history documentation, stress care",
    "career": "Career planning, ethical mentorship, skill building, work-boundary discipline",
    "finance": "Budgeting, emergency fund, insurance, tax compliance, ethical earning habits",
    "relationship": "Healthy communication, couples counseling when needed, respect and boundaries",
}

HOUSE_MODERN: dict[Domain, dict[int, str]] = {
    "health": {
        1: "Baseline health screening, sleep and immunity routine, posture and stress care",
        2: "Dental and thyroid screening if relevant, food discipline, reduce tobacco and excess sugar",
        3: "Nerve and lung care, physiotherapy, breathwork, reduce overthinking",
        4: "Cardiac and respiratory screening, therapy for emotional patterns, peaceful home habits",
        5: "Gut and fertility awareness, hormonal checks if symptoms exist, calm parenting approach",
        6: "Strong medical insurance, chronic care plan, avoid delaying treatment",
        7: "Sexual and reproductive health awareness, therapy for relationship stress",
        8: "Deep preventive screening, genetic risk awareness, chronic disease documentation",
        9: "Liver and hip care, ethical belief work, document paternal family health history",
        10: "Spine care, burnout prevention, cardiac screening if high work stress",
        11: "Endocrine screening, reduce social comparison stress, healthy circulation habits",
        12: "Sleep hygiene, addiction screening, mental health support, hospital preparedness",
    },
    "career": {
        1: "Build professional identity, executive coaching, confidence and health for leadership",
        2: "Improve workplace communication, document agreements, family-business boundaries",
        3: "Upskill regularly, writing and presentation practice, resolve sibling rivalry affecting focus",
        4: "Work-life boundaries, remote-work structure, reduce carrying family stress to office",
        5: "Strategic planning, avoid emotional business decisions, mentorship for entrepreneurship",
        6: "HR and legal awareness, conflict documentation, stress care in competitive jobs",
        7: "Client/partner vetting, contract clarity, avoid mixing personal and business conflicts",
        8: "Crisis plan for job loss, reputation protection, transparency over secrecy at work",
        9: "Choose ethical mentors, avoid blind career jumps, align work with values",
        10: "Leadership training, reputation management, avoid shortcuts, document achievements",
        11: "Professional networking with discernment, diversify income ethically, mentor quality over quantity",
        12: "Foreign job due diligence, expense planning, burnout recovery and sleep discipline",
    },
    "finance": {
        1: "Personal finance literacy, self-worth work separate from net worth",
        2: "Savings automation, speech discipline in money talks, family finance meetings",
        3: "Business communication clarity, written contracts, skill-based income growth",
        4: "Property due diligence, home insurance, resolve family asset conversations early",
        5: "Avoid emotional speculation, diversified investing, financial advisor when needed",
        6: "Debt reduction plan, dispute resolution, medical and legal expense buffers",
        7: "Partnership agreements, profit-sharing clarity, joint-account transparency",
        8: "Estate planning, inheritance documentation, tax and property legal review",
        9: "Long-term wealth plan, ethical earning, avoid luck-dependent shortcuts",
        10: "Income diversification, professional revenue tracking, career-linked insurance",
        11: "Revenue forecasting, client payment systems, avoid fake investment schemes",
        12: "Track hidden expenses, foreign remittance discipline, philanthropy with limits",
    },
    "relationship": {
        1: "Self-awareness therapy, identity work, avoid losing self in relationships",
        2: "Family communication training, reduce harsh speech, shared meal rituals",
        3: "Sibling mediation, honest expression, reduce triangulation in conflicts",
        4: "Home emotional safety, childhood healing, mother/in-law boundary work",
        5: "Romance with maturity, fertility planning without panic, parenting stress care",
        6: "Conflict de-escalation skills, criticism awareness, legal help only when necessary",
        7: "Couples counseling, premarital compatibility work, marriage expectations alignment",
        8: "Trust rebuilding, intimacy counseling, in-law boundaries, transparency practices",
        9: "Cultural and belief alignment talks, seek elder blessings through respectful dialogue",
        10: "Protect relationship time from overwork, shared calendar for family",
        11: "Choose supportive friends, reduce gossip networks, elder sibling harmony",
        12: "Privacy respect, intimacy scheduling, address loneliness before it deepens",
    },
}

PATTERN_CONVENTIONAL: dict[Domain, list[tuple[str, str]]] = {
    "health": [
        (r"Sun \+ Rahu", "Surya-Rahu shanti, Shiva puja, father-line healing"),
        (r"Sun \+ Ketu", "Surya-Ketu peace, ancestral remembrance, vitality rituals"),
        (r"Sun \+ Saturn", "Surya-Shani peace, spine and bone care prayers"),
        (r"Moon \+ Rahu", "Chandra-Rahu shanti, emotional grounding rituals"),
        (r"Moon \+ Ketu", "Chandra-Ketu peace, mother-line healing"),
        (r"Saturn \+ Rahu", "Shani-Rahu shanti, Mahamrityunjaya japa"),
        (r"Saturn \+ Ketu", "Ketu-Saturn peace, elder seva"),
        (r"Rahu/Ketu", "Rahu-Ketu axis peace rituals"),
        (r"9th lord", "9th lord peace rituals, father worship, pitru tarpan"),
        (r"Gulika|Mandi", "Gulika shanti, Saturday remedies"),
        (r"D-9|Navamsa", "Navamsa peace puja, marriage-health balance rituals"),
        (r"D-12", "Ancestor healing rituals, sleep and hospital-karma prayers"),
    ],
    "career": [
        (r"Sun \+ Rahu", "Surya-Rahu shanti for authority, Sunday workplace Surya arghya"),
        (r"Sun \+ Ketu", "Surya-Ketu peace for career clarity and visibility"),
        (r"Sun \+ Saturn", "Surya-Shani peace for boss and authority karma"),
        (r"Sun \+ Mars", "Surya-Mangal shanti for leadership aggression balance"),
        (r"Saturn \+ Rahu", "Shani-Rahu shanti for toxic workplace and delayed growth"),
        (r"Saturn \+ Ketu", "Ketu-Saturn peace for recognition and isolation at work"),
        (r"9th lord", "Guru and father blessings, Thursday puja for career fortune"),
        (r"10th lord", "10th house karma-yoga rituals, Vishwakarma worship"),
        (r"Rahu/Ketu.*4th-10th|4th-10th", "Griha shanti with career dharma rituals"),
        (r"Rahu/Ketu.*3rd-9th|3rd-9th", "Sibling and mentor-line peace for career guidance"),
        (r"Rahu/Ketu.*6th-12th|6th-12th", "Service and foreign-work protection rituals"),
        (r"Rahu/Ketu.*2nd-8th|2nd-8th", "Family wealth and career stability tarpan"),
        (r"Rahu/Ketu.*5th-11th|5th-11th", "Ethical gains and network dharma rituals"),
        (r"D-10|Dashamsha", "Dashamsha career peace puja, professional dharma vows"),
        (r"6th", "Hanuman worship for workplace courage and dispute protection"),
        (r"11th", "Ethical networking prayers, avoid false promise energies"),
    ],
    "finance": [
        (r"Sun \+ Rahu", "Surya-Rahu shanti for wealth ego and risky decisions"),
        (r"Sun \+ Ketu", "Surya-Ketu peace for savings discipline"),
        (r"Sun \+ Saturn", "Surya-Shani peace for slow wealth and responsibility"),
        (r"Sun \+ Mars", "Surya-Mangal shanti for impulsive spending control"),
        (r"Saturn \+ Rahu", "Shani-Rahu shanti for debt and unstable gains"),
        (r"Saturn \+ Ketu", "Ketu-Saturn peace for wealth detachment balance"),
        (r"2nd lord", "2nd house Lakshmi peace, family wealth tarpan"),
        (r"8th lord", "Inheritance and joint-asset shanti rituals"),
        (r"11th lord", "Kubera worship for steady gains and receivables"),
        (r"12th lord", "Expense-control and leakage-prevention rituals"),
        (r"5th lord", "Dhana-Lakshmi puja, ethical speculation vows"),
        (r"9th lord", "Fortune-line wealth prayers, father blessings"),
        (r"4th lord|4th house", "Property and fixed-asset peace rituals"),
        (r"Rahu/Ketu.*2nd-8th|2nd-8th", "Family lineage wealth tarpan, 2nd-8th axis shanti"),
        (r"Rahu/Ketu.*5th-11th|5th-11th", "Ethical investment and gains rituals"),
        (r"Jupiter", "Guru puja for financial wisdom and good advisors"),
        (r"Venus", "Lakshmi-Venus Friday puja for comfort and cash flow"),
        (r"Mercury", "Vishnu worship for contracts, accounts and honest trade"),
        (r"D-2|Hora", "Hora wealth-strength rituals, savings blessings"),
        (r"D-10", "Professional income stability rituals"),
        (r"D-12", "Ancestral property and wealth-karma healing"),
        (r"Dasha", "Timed wealth discipline, charity and ethical vows in dasha"),
    ],
    "relationship": [
        (r"Sun \+ Rahu", "Surya-Rahu shanti for ego and trust in marriage"),
        (r"Sun \+ Ketu", "Surya-Ketu peace for warmth and marital connection"),
        (r"Sun \+ Saturn", "Surya-Shani peace for authority and dominance issues"),
        (r"Sun \+ Mars", "Surya-Mangal shanti for anger and conflict reduction"),
        (r"Moon \+ Rahu", "Chandra-Rahu shanti for emotional security in love"),
        (r"Moon \+ Ketu", "Chandra-Ketu peace for nurturing and attachment"),
        (r"Saturn \+ Rahu", "Shani-Rahu shanti for marriage delay and suspicion"),
        (r"Saturn \+ Ketu", "Ketu-Saturn peace for coldness and duty-only relating"),
        (r"Venus \+ Rahu", "Venus-Rahu shanti for attraction and expectation balance"),
        (r"Venus \+ Ketu", "Venus-Ketu peace for love satisfaction"),
        (r"7th lord", "7th house marriage peace, spouse harmony rituals"),
        (r"9th lord", "Elder blessings and dharma-aligned marriage prayers"),
        (r"Jupiter", "Guru puja for wise partner choices and children blessings"),
        (r"Mars", "Hanuman worship for passion without aggression"),
        (r"Mercury", "Vishnu prayers for truthful communication"),
        (r"Saturn.*Venus|Venus.*Saturn", "Shani-Venus peace for romance and delay"),
        (r"Rahu/Ketu.*1st-7th|1st-7th", "Lagna-marriage axis peace rituals"),
        (r"Rahu/Ketu.*2nd-8th|2nd-8th", "Family and in-law wealth-intimacy healing"),
        (r"Rahu/Ketu.*4th-10th|4th-10th", "Home-career balance for relationship peace"),
        (r"D-9|Navamsa", "Navamsa marriage peace puja, spouse dharma rituals"),
        (r"D-12", "Parental-pattern healing for marriage karma"),
        (r"Dasha", "Relationship discipline and patience during nodal/Saturn periods"),
        (r"Transit", "Temporary restraint, prayer and counseling during heavy transits"),
    ],
}

PATTERN_MODERN: dict[Domain, list[tuple[str, str]]] = {
    "health": [
        (r"chronic|fatigue|weak", "Long-term medical care plan, therapy, disciplined routine"),
        (r"heart|BP|cardiac", "Cardiac screening, BP monitoring, reduce smoking and excess stress"),
        (r"sleep|insomnia|hospital", "Sleep hygiene, mental health support, hospital preparedness"),
        (r"fertility|child|reproductive", "Fertility evaluation if needed, hormonal tests, calm parenting approach"),
        (r"genetic|inheritance|8th", "Family medical mapping, genetic counseling if indicated"),
        (r"anxiety|depression|emotional", "Therapy, grounding practices, emotional regulation skills"),
    ],
    "career": [
        (r"reputation|authority|recognition", "Reputation management, ethical leadership, document achievements"),
        (r"mentor|guidance|9th", "Vet mentors carefully, career counseling, values-aligned decisions"),
        (r"delay|stuck|slow", "Long-term skill building, patience with timing, avoid despair"),
        (r"conflict|politics|boss|6th", "Workplace conflict training, HR awareness, professional boundaries"),
        (r"sudden|loss|break|8th", "Crisis career plan, emergency savings, legal review if needed"),
        (r"foreign|12th", "Foreign job due diligence, relocation planning, burnout care"),
        (r"toxic|pressure|burden", "Mental health support, job change strategy, stress recovery"),
        (r"shortcut|unethical|risky", "Ethical career choices, compliance awareness, avoid fraud"),
    ],
    "finance": [
        (r"savings|retention|hold", "Automate savings, expense tracking, reduce leakage"),
        (r"inheritance|property|8th|4th", "Estate planning, legal documentation, property due diligence"),
        (r"speculation|trading|5th|market", "Avoid gambling mindset, diversified investing, risk limits"),
        (r"debt|loan|6th", "Debt payoff plan, dispute resolution, emergency buffer"),
        (r"network|gains|11th", "Verify investment offers, ethical networking, receivables tracking"),
        (r"expense|loss|12th", "Budget review, subscription audit, foreign expense control"),
        (r"dispute|family wealth|2nd", "Family finance mediation, clear speech about money"),
        (r"tax|legal|fraud", "Professional tax advice, contract review, fraud awareness"),
    ],
    "relationship": [
        (r"marriage|spouse|7th", "Couples counseling, premarital work, shared expectations"),
        (r"trust|suspicion|secrecy|8th", "Transparency practices, trust rebuilding, intimacy counseling"),
        (r"delay|cold|distance|Saturn", "Patience with timing, warmth-building habits, date rituals"),
        (r"conflict|anger|quarrel|Mars", "Anger management, conflict de-escalation, cooling-off rules"),
        (r"in-law|family|2nd|4th", "Boundary setting with family, mediated family talks"),
        (r"child|fertility|5th", "Fertility support without panic, co-parenting alignment"),
        (r"attraction|temptation|Rahu", "Relationship accountability, avoid secrecy, ethical boundaries"),
        (r"communication|speech|Mercury", "Active listening training, reduce sarcasm and blame"),
        (r"separation|distance|12th", "Reconnect rituals, quality time planning, loneliness care"),
        (r"transit|timing|Dasha", "Do not make impulsive relationship decisions under stress"),
    ],
}


def _house_num(house_label: str) -> int | None:
    m = re.match(r"^(\d+)", house_label.strip())
    return int(m.group(1)) if m else None


def _unique_join(parts: list[str], limit: int = 5) -> str:
    seen: set[str] = set()
    out: list[str] = []
    for part in parts:
        chunk = part.strip().rstrip(";., ")
        if not chunk:
            continue
        key = chunk.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(chunk)
        if len(out) >= limit:
            break
    return "; ".join(out)


def _match_patterns(text: str, patterns: list[tuple[str, str]]) -> list[str]:
    hits: list[str] = []
    for pattern, remedy in patterns:
        if re.search(pattern, text, re.I):
            hits.append(remedy)
    return hits


def _planet_hits(combination: str) -> list[str]:
    hits: list[str] = []
    for planet, remedy in PLANET_CONVENTIONAL.items():
        if planet in combination:
            hits.append(remedy)
    return hits


def _health_lookup(combination: str) -> dict[str, str] | None:
    if combination in HEALTH_REMEDIES_BY_COMBINATION:
        return HEALTH_REMEDIES_BY_COMBINATION[combination]
    return None


def remedies_for_domain(
    combination: str,
    domain: Domain,
    house_label: str,
    area_affected: str,
    impact: str,
) -> dict[str, str]:
    """Return conventional_remedies and modern_remedies for one domain row."""
    if domain == "health":
        stored = _health_lookup(combination)
        if stored:
            return stored

    context = f"{combination} {area_affected} {impact}"
    house_num = _house_num(house_label)

    conventional_parts = [PITRU_BASE, DOMAIN_BASE_CONVENTIONAL[domain]]
    if house_num and house_num in HOUSE_CONVENTIONAL[domain]:
        conventional_parts.append(HOUSE_CONVENTIONAL[domain][house_num])
    conventional_parts.extend(_match_patterns(context, PATTERN_CONVENTIONAL[domain]))
    conventional_parts.extend(_planet_hits(combination))

    modern_parts = [DOMAIN_BASE_MODERN[domain]]
    if house_num and house_num in HOUSE_MODERN[domain]:
        modern_parts.append(HOUSE_MODERN[domain][house_num])
    modern_parts.extend(_match_patterns(context, PATTERN_MODERN[domain]))

    return {
        "conventional_remedies": _unique_join(conventional_parts, limit=6),
        "modern_remedies": _unique_join(modern_parts, limit=5),
    }


def enrich_domain(domain_data: dict[str, str], combination: str, domain: Domain, house_label: str) -> None:
    remedies = remedies_for_domain(
        combination,
        domain,
        house_label,
        domain_data.get("area_affected", ""),
        domain_data.get("impact", ""),
    )
    domain_data["conventional_remedies"] = remedies["conventional_remedies"]
    domain_data["modern_remedies"] = remedies["modern_remedies"]
