"""
Guru Chandal (Chandal Dosha) reference — 12 types by Jupiter house + Rahu/Ketu variants.
"""

from __future__ import annotations

from typing import TypedDict


class HouseRow(TypedDict):
    house: int
    name_en: str
    name_hi: str
    name_gu: str
    sanskrit_theme: str
    house_category: str
    impact_area: str
    impact_types: str
    positive_note: str
    severity_baseline: str
    conventional_remedies: str
    modern_remedies: str


class VariantRow(TypedDict):
    variant: str
    label_en: str
    label_hi: str
    label_gu: str
    variant_impact: str
    variant_positive: str


_UNIVERSAL_CONVENTIONAL = (
    "Thursday Guru worship; Om Graam Greem Graum Sah Gurave Namah (108×); Vishnu Sahasranama; "
    "donate yellow items (turmeric, chana dal) to teachers or students; respect qualified gurus."
)

_UNIVERSAL_MODERN = (
    "Verify spiritual and professional mentors; maintain written ethical commitments; "
    "avoid get-rich-quick schemes; seek counselling if religious doubt causes distress."
)

_HOUSES: list[HouseRow] = [
    {
        "house": 1,
        "name_en": "Lagna Guru Chandal",
        "name_hi": "लग्न गुरु चांडाल",
        "name_gu": "લગ્ન ગુરુ ચાંડાલ",
        "sanskrit_theme": "Tanu",
        "house_category": "kendra",
        "impact_area": "Self, body, vitality, personal dharma, life direction",
        "impact_types": (
            "Identity confusion; ego masking insecurity; unstable moral compass; may reject good counsel; "
            "health sensitivity (liver, weight, hormones)."
        ),
        "positive_note": (
            "Personality bridging tradition and innovation; self-made philosopher; "
            "strong public presence when Jupiter is dignified."
        ),
        "severity_baseline": "High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Offer water to Sun at sunrise for vitality.",
        "modern_remedies": _UNIVERSAL_MODERN + " Regular health screening; identity-focused therapy if needed.",
    },
    {
        "house": 2,
        "name_en": "Dhana Guru Chandal",
        "name_hi": "धन गुरु चांडाल",
        "name_gu": "ધન ગુરુ ચાંડાલ",
        "sanskrit_theme": "Dhana",
        "house_category": "artha",
        "impact_area": "Wealth, speech, family values, food habits",
        "impact_types": (
            "Harsh or persuasive speech; family disputes over religion or money; "
            "unstable dharmic values around finance; sweet talk with hidden motive."
        ),
        "positive_note": "Eloquent teacher; wealth through foreign or education channels; reform of family customs.",
        "severity_baseline": "High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Speak truthfully; donate food on Thursdays.",
        "modern_remedies": _UNIVERSAL_MODERN + " Family financial planning; honest communication practices.",
    },
    {
        "house": 3,
        "name_en": "Sahaj Guru Chandal",
        "name_hi": "सहज गुरु चांडाल",
        "name_gu": "સહજ ગુરુ ચાંડાલ",
        "sanskrit_theme": "Sahaj",
        "house_category": "upachaya",
        "impact_area": "Siblings, courage, communication, skills, short journeys",
        "impact_types": (
            "Miscommunication with siblings or peers; bold but misguided plans; "
            "controversial writings or media views."
        ),
        "positive_note": "Powerful orator; investigative communicator; courage to speak against injustice.",
        "severity_baseline": "Moderate",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Respect siblings; chant Guru mantra before important speech.",
        "modern_remedies": _UNIVERSAL_MODERN + " Media literacy; conflict resolution skills with siblings.",
    },
    {
        "house": 4,
        "name_en": "Sukha Guru Chandal",
        "name_hi": "सुख गुरु चांडाल",
        "name_gu": "સુખ ગુરુ ચાંડાલ",
        "sanskrit_theme": "Sukha",
        "house_category": "kendra",
        "impact_area": "Home, mother, property, vehicles, inner peace",
        "impact_types": (
            "Domestic unrest; complex mother relationship; desire for grand home without peace; "
            "property disputes or real-estate deception."
        ),
        "positive_note": "Home as learning centre; multicultural household; emotional depth through spiritual seeking.",
        "severity_baseline": "High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Mother seva; Thursday charity for women's education.",
        "modern_remedies": _UNIVERSAL_MODERN + " Property due diligence; family therapy for domestic harmony.",
    },
    {
        "house": 5,
        "name_en": "Putra Guru Chandal",
        "name_hi": "पुत्र गुरु चांडाल",
        "name_gu": "પુત્ર ગુરુ ચાંડાલ",
        "sanskrit_theme": "Putra",
        "house_category": "trikona",
        "impact_area": "Children, education, creativity, romance, speculation",
        "impact_types": (
            "Progeny worries or unconventional children's paths; speculative misjudgment; "
            "arrogance in studies; romance idealism gone wrong."
        ),
        "positive_note": (
            "Brilliant unconventional intelligence; creative genius; innovative pedagogy — "
            "strong trikona channel when Jupiter is dignified."
        ),
        "severity_baseline": "Moderate-High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Support children's education; avoid gambling.",
        "modern_remedies": _UNIVERSAL_MODERN + " Responsible parenting; avoid speculative trading without discipline.",
    },
    {
        "house": 6,
        "name_en": "Ripu Guru Chandal",
        "name_hi": "रिपु गुरु चांडाल",
        "name_gu": "રિપુ ગુરુ ચાંડાલ",
        "sanskrit_theme": "Ripu",
        "house_category": "dusthana",
        "impact_area": "Enemies, debts, litigation, service, chronic illness",
        "impact_types": (
            "Workplace politics; legal battles; unethical competition; "
            "service in morally grey institutions; hard-to-diagnose illness."
        ),
        "positive_note": "Victory over powerful opponents when Jupiter is strong; healer in alternative medicine.",
        "severity_baseline": "Very High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Serve the sick humbly; Hanuman worship for courage in disputes.",
        "modern_remedies": _UNIVERSAL_MODERN + " Legal counsel early; workplace ethics training; chronic care screening.",
    },
    {
        "house": 7,
        "name_en": "Kalatra Guru Chandal",
        "name_hi": "कलत्र गुरु चांडाल",
        "name_gu": "કલત્ર ગુરુ ચાંડાલ",
        "sanskrit_theme": "Kalatra",
        "house_category": "kendra",
        "impact_area": "Marriage, spouse, business partnerships, contracts",
        "impact_types": (
            "Marital discord; unconventional or foreign spouse; trust issues in contracts; "
            "partner who confuses dharma."
        ),
        "positive_note": "Cross-cultural partnership; education or law business with global reach.",
        "severity_baseline": "High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Couple worship on Thursdays; honest partnership vows.",
        "modern_remedies": _UNIVERSAL_MODERN + " Pre-marital counselling; clear written contracts in business.",
    },
    {
        "house": 8,
        "name_en": "Randhra Guru Chandal",
        "name_hi": "रन्ध्र गुरु चांडाल",
        "name_gu": "રન્ધ્ર ગુરુ ચાંડાલ",
        "sanskrit_theme": "Randhra",
        "house_category": "dusthana",
        "impact_area": "Longevity, sudden events, inheritance, occult, shared resources",
        "impact_types": (
            "Sudden reversals; inheritance disputes; occult fascination without guru; "
            "secrecy around ethics; anxiety about mortality."
        ),
        "positive_note": "Deep researcher in astrology, ayurveda, or psychology; transformative wisdom through crisis.",
        "severity_baseline": "Very High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Ancestor remembrance; disciplined occult study only with authentic teacher.",
        "modern_remedies": _UNIVERSAL_MODERN + " Estate planning; trauma-informed therapy after sudden losses.",
    },
    {
        "house": 9,
        "name_en": "Bhagya Guru Chandal",
        "name_hi": "भाग्य गुरु चांडाल",
        "name_gu": "ભાગ્ય ગુરુ ચાંડાલ",
        "sanskrit_theme": "Bhagya",
        "house_category": "trikona",
        "impact_area": "Father, guru, dharma, fortune, higher education, pilgrimage",
        "impact_types": (
            "Core Guru Chandal house — guru disputes; father distance; false teachers; "
            "ideological rebellion; breaks in higher degree."
        ),
        "positive_note": (
            "Religious reformer; philosopher; dharmic lawyer; international professor — "
            "especially strong when Jupiter is in own or exaltation sign."
        ),
        "severity_baseline": "High",
        "conventional_remedies": (
            _UNIVERSAL_CONVENTIONAL
            + " Father/guru reconciliation rituals; study authentic shastras; pilgrimage with discernment."
        ),
        "modern_remedies": _UNIVERSAL_MODERN + " Verify guru credentials; complete formal higher education where possible.",
    },
    {
        "house": 10,
        "name_en": "Karma Guru Chandal",
        "name_hi": "कर्म गुरु चांडाल",
        "name_gu": "કર્મ ગુરુ ચાંડાલ",
        "sanskrit_theme": "Karma",
        "house_category": "kendra",
        "impact_area": "Career, authority, government, public reputation",
        "impact_types": (
            "Career scandals; public ethical slips; authority conflicts; "
            "reputation risk through guru or religion themes."
        ),
        "positive_note": "Unconventional career success; judge, professor, NGO leader; foreign-linked profession.",
        "severity_baseline": "High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Professional integrity vows; Thursday charity for students.",
        "modern_remedies": _UNIVERSAL_MODERN + " Public ethics training; transparency in professional role.",
    },
    {
        "house": 11,
        "name_en": "Labha Guru Chandal",
        "name_hi": "लाभ गुरु चांडाल",
        "name_gu": "લાભ ગુરુ ચાંડાલ",
        "sanskrit_theme": "Labha",
        "house_category": "upachaya",
        "impact_area": "Gains, networks, elder siblings, aspirations, social circles",
        "impact_types": (
            "Gains through questionable networks; unreliable friends; "
            "hopes inflated by Rahu then disappointed."
        ),
        "positive_note": "Large following as teacher; gains from foreign alliances; social reform movements.",
        "severity_baseline": "Moderate",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Donate a portion of gains; avoid unethical networking.",
        "modern_remedies": _UNIVERSAL_MODERN + " Vet professional networks; realistic goal-setting.",
    },
    {
        "house": 12,
        "name_en": "Vyaya Guru Chandal",
        "name_hi": "व्यय गुरु चांडाल",
        "name_gu": "વ્યય ગુરુ ચાંડાલ",
        "sanskrit_theme": "Vyaya",
        "house_category": "dusthana",
        "impact_area": "Expenses, foreign lands, isolation, sleep, moksha, hospitals",
        "impact_types": (
            "Hidden expenses; foreign settlement confusion; spiritual escapism; "
            "secret guru cults; hospital-related costs."
        ),
        "positive_note": "Genuine monastic inclination; foreign spiritual study; liberation path when Jupiter is strong.",
        "severity_baseline": "Very High",
        "conventional_remedies": _UNIVERSAL_CONVENTIONAL + " Ketu/Rahu balance mantras; structured meditation retreat.",
        "modern_remedies": _UNIVERSAL_MODERN + " Budget discipline; sleep hygiene; avoid spiritual bypass.",
    },
]

_VARIANTS: list[VariantRow] = [
    {
        "variant": "guru_rahu",
        "label_en": "Guru Chandal (Jupiter + Rahu)",
        "label_hi": "गुरु चांडाल (गुरु + राहु)",
        "label_gu": "ગુરુ ચાંડાલ (ગુરુ + રાહુ)",
        "variant_impact": (
            "Material ambition in guru's name; foreign or unorthodox paths; ethical shortcuts; "
            "spiritual materialism — pursuing status through wisdom symbols; attraction to charismatic teachers."
        ),
        "variant_positive": (
            "Foreign education; global business; cross-cultural philosophy; "
            "innovative teaching that reaches unconventional audiences."
        ),
    },
    {
        "variant": "guru_ketu",
        "label_en": "Guru-Ketu Yoga (Jupiter + Ketu)",
        "label_hi": "गुरु-केतु योग (गुरु + केतु)",
        "label_gu": "ગુરુ-કેતુ યોગ (ગુરુ + કેતુ)",
        "variant_impact": (
            "Spiritual confusion; detachment from true guru; faith swings; "
            "rejecting all teachers; moksha themes without grounding; past-life spiritual residue."
        ),
        "variant_positive": (
            "Deep meditation capacity; mystical research; minimalist ethics; "
            "genuine insight when supported by structured practice."
        ),
    },
]

_BY_HOUSE: dict[int, HouseRow] = {r["house"]: r for r in _HOUSES}
_BY_VARIANT: dict[str, VariantRow] = {r["variant"]: r for r in _VARIANTS}


def house_lookup(jupiter_house: int) -> HouseRow | None:
    return _BY_HOUSE.get(jupiter_house)


def variant_lookup(variant: str) -> VariantRow | None:
    return _BY_VARIANT.get(variant)
