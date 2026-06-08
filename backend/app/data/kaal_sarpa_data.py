"""
Kaal Sarpa type reference data — 12 types by Rahu house (D1, Whole Sign).
"""

from __future__ import annotations

from typing import TypedDict


class TypeRow(TypedDict):
    house: int
    name_en: str
    name_hi: str
    name_gu: str
    sanskrit: str
    impact_area: str
    impact_types: str
    severity_baseline: str
    life_domains: list[str]
    conventional_remedies: str
    modern_remedies: str
    positive_note: str


_TYPES: list[TypeRow] = [
    {
        "house": 1,
        "name_en": "Anant Kaal Sarpa",
        "name_hi": "अनन्त कालसर्प",
        "name_gu": "અનંત કાલસર્પ",
        "sanskrit": "Anant",
        "impact_area": "Self, health, identity, life direction",
        "impact_types": (
            "Identity confusion, self-doubt, health fluctuations, head/face concerns, "
            "delayed recognition, tendency to reinvent self after obstacles."
        ),
        "severity_baseline": "High",
        "life_domains": ["self", "health", "identity"],
        "conventional_remedies": (
            "Monday Shiva puja, Om Namah Shivaya japa, Nag Panchami vrat, "
            "Kaal Sarpa shanti at Trimbakeshwar or local Shiva temple, Rahu-Ketu peace rituals."
        ),
        "modern_remedies": (
            "Regular health check-ups, structured self-care routine, therapy for identity stress, "
            "consistent sleep and exercise, career coaching for direction clarity."
        ),
        "positive_note": "Capacity for deep self-transformation after initial struggles.",
    },
    {
        "house": 2,
        "name_en": "Kulik Kaal Sarpa",
        "name_hi": "कुलिक कालसर्प",
        "name_gu": "કુલિક કાલસર્પ",
        "sanskrit": "Kulik",
        "impact_area": "Wealth, family, speech, values",
        "impact_types": (
            "Financial instability, unexpected expenses, family discord, speech misunderstandings, "
            "difficulty accumulating savings, ancestral property tensions."
        ),
        "severity_baseline": "High",
        "life_domains": ["wealth", "family", "speech"],
        "conventional_remedies": (
            "Friday Lakshmi puja, Pitru tarpan on Amavasya, Saturday charity to elders, "
            "family harmony havan, respectful speech discipline and ancestral remembrance."
        ),
        "modern_remedies": (
            "Budget planning, emergency savings fund, family counseling, "
            "document family property clearly, thyroid/dental screening if indicated."
        ),
        "positive_note": "Wealth can stabilize through disciplined savings and ancestral remedies.",
    },
    {
        "house": 3,
        "name_en": "Vasuki Kaal Sarpa",
        "name_hi": "वासुकि कालसर्प",
        "name_gu": "વાસુકિ કાલસર્પ",
        "sanskrit": "Vasuki",
        "impact_area": "Siblings, courage, communication",
        "impact_types": (
            "Strained sibling relations, miscommunication, effort-heavy success, "
            "hidden fears despite bold plans, rumors or legal/writing issues."
        ),
        "severity_baseline": "Moderate",
        "life_domains": ["siblings", "courage", "communication"],
        "conventional_remedies": (
            "Wednesday Mercury prayers, Hanuman worship for courage, "
            "honest communication vows, sibling reconciliation rituals on auspicious days."
        ),
        "modern_remedies": (
            "Communication skills training, conflict resolution with siblings, "
            "posture and breathing exercises, therapy for anxiety, fact-check before reacting."
        ),
        "positive_note": "Success through persistent effort and skill in communication.",
    },
    {
        "house": 4,
        "name_en": "Shankhpal Kaal Sarpa",
        "name_hi": "शंखपाल कालसर्प",
        "name_gu": "શંખપાલ કાલસર્પ",
        "sanskrit": "Shankhpal",
        "impact_area": "Home, mother, property, inner peace",
        "impact_types": (
            "Domestic unrest, mother's health concerns, frequent relocations, "
            "property/vehicle delays, inner restlessness and disturbed peace of mind."
        ),
        "severity_baseline": "High",
        "life_domains": ["home", "mother", "property"],
        "conventional_remedies": (
            "Monday Chandra puja, Vastu peace rituals for home, respect and seva for mother, "
            "Griha shanti, offering white items on Mondays."
        ),
        "modern_remedies": (
            "Create a calm home environment, mother's health screening, "
            "therapy for emotional security, careful property documentation before purchase."
        ),
        "positive_note": "Deep emotional maturity develops through domestic challenges.",
    },
    {
        "house": 5,
        "name_en": "Padma Kaal Sarpa",
        "name_hi": "पद्म कालसर्प",
        "name_gu": "પદ્મ કાલસર્પ",
        "sanskrit": "Padma",
        "impact_area": "Children, education, creativity, romance",
        "impact_types": (
            "Delays or worries related to progeny, interrupted education, complicated romance, "
            "speculative losses, non-linear learning paths."
        ),
        "severity_baseline": "Moderate",
        "life_domains": ["children", "education", "romance"],
        "conventional_remedies": (
            "Thursday Jupiter worship, Guru seva, Santan Gopal mantra if seeking children, "
            "Saraswati puja for education, avoid reckless speculation vows."
        ),
        "modern_remedies": (
            "Fertility consultation if needed, structured education plan, "
            "financial discipline around speculation, relationship counseling when appropriate."
        ),
        "positive_note": "Creative and intellectual gifts may flourish after initial delays.",
    },
    {
        "house": 6,
        "name_en": "Mahapadma Kaal Sarpa",
        "name_hi": "महापद्म कालसर्प",
        "name_gu": "મહાપદ્મ કાલસર્પ",
        "sanskrit": "Mahapadma",
        "impact_area": "Enemies, debts, disease, service",
        "impact_types": (
            "Legal battles, loans, workplace politics, hard-to-diagnose ailments; "
            "Rahu in 6th can also give victory over enemies through competition."
        ),
        "severity_baseline": "Moderate",
        "life_domains": ["enemies", "debts", "health"],
        "conventional_remedies": (
            "Tuesday Mars remedies, service to the sick and needy, debt repayment rituals on Saturdays, "
            "Mahamrityunjaya japa for chronic health concerns."
        ),
        "modern_remedies": (
            "Legal advice when disputes arise, structured debt repayment plan, "
            "comprehensive medical workup for unexplained symptoms, workplace boundaries."
        ),
        "positive_note": "Strength through adversity; success in competitive fields is possible.",
    },
    {
        "house": 7,
        "name_en": "Takshak Kaal Sarpa",
        "name_hi": "तक्षक कालसर्प",
        "name_gu": "તક્ષક કાલસર્પ",
        "sanskrit": "Takshak",
        "impact_area": "Marriage, partnerships, contracts",
        "impact_types": (
            "Delayed marriage, marital discord, partnership breakups, contract disputes, "
            "trust issues, legal separations."
        ),
        "severity_baseline": "Very High",
        "life_domains": ["marriage", "partnerships", "legal"],
        "conventional_remedies": (
            "Friday Venus puja, couple temple visit (Trimbakeshwar/Kaal Sarpa shanti), "
            "Rahu-Venus shanti, Uma Maheshwara worship for marital harmony."
        ),
        "modern_remedies": (
            "Premarital and marriage counseling, clear written contracts in business, "
            "mediation before litigation, couples therapy for trust rebuilding."
        ),
        "positive_note": "Deep commitment and loyalty can emerge after relationship trials.",
    },
    {
        "house": 8,
        "name_en": "Karkotak Kaal Sarpa",
        "name_hi": "कर्कोटक कालसर्प",
        "name_gu": "કર્કોટક કાલસર્પ",
        "sanskrit": "Karkotak",
        "impact_area": "Longevity, sudden events, inheritance, occult",
        "impact_types": (
            "Sudden life changes, inheritance disputes, psychological depth, "
            "interest in occult sciences, chronic or hidden health concerns."
        ),
        "severity_baseline": "Very High",
        "life_domains": ["longevity", "inheritance", "occult"],
        "conventional_remedies": (
            "Saturday Saturn worship, Ketu shanti puja, ancestral tarpan, "
            "Mahamrityunjaya japa, meditation under qualified guidance."
        ),
        "modern_remedies": (
            "Estate planning and clear wills, therapy for trauma processing, "
            "regular health screening, avoid risky ventures without due diligence."
        ),
        "positive_note": "Profound spiritual insight and resilience through transformation.",
    },
    {
        "house": 9,
        "name_en": "Shankhnaad Kaal Sarpa",
        "name_hi": "शंखनाद कालसर्प",
        "name_gu": "શંખનાદ કાલસર્પ",
        "sanskrit": "Shankhnaad",
        "impact_area": "Father, dharma, fortune, higher learning",
        "impact_types": (
            "Distance from father or guru, ideological conflicts, questioning tradition, "
            "fortune through foreign or unconventional paths after struggle."
        ),
        "severity_baseline": "High",
        "life_domains": ["father", "dharma", "fortune"],
        "conventional_remedies": (
            "Thursday Jupiter worship, pilgrimage, Pitru tarpan, respect for father and teachers, "
            "Guru dakshina and dharma seva."
        ),
        "modern_remedies": (
            "Reconcile with father where possible, ethical mentorship, "
            "higher education planning, therapy for belief conflicts and purpose clarity."
        ),
        "positive_note": "Authentic spiritual seeking and dharma clarity after confusion.",
    },
    {
        "house": 10,
        "name_en": "Ghatak Kaal Sarpa",
        "name_hi": "घातक कालसर्प",
        "name_gu": "ઘાતક કાલસર્પ",
        "sanskrit": "Ghatak",
        "impact_area": "Career, status, reputation",
        "impact_types": (
            "Unstable career, sudden rises and falls, authority conflicts, "
            "public reputation risks, government or legal entanglements."
        ),
        "severity_baseline": "High",
        "life_domains": ["career", "reputation", "authority"],
        "conventional_remedies": (
            "Sunday Surya arghya, ethical career conduct, Saturn Sunday charity, "
            "Surya Namaskar, avoid dishonesty in public dealings."
        ),
        "modern_remedies": (
            "Professional mentorship, reputation management, compliance with regulations, "
            "stress management for leadership roles, documented career milestones."
        ),
        "positive_note": "Hard-won recognition and leadership after sustained perseverance.",
    },
    {
        "house": 11,
        "name_en": "Vishdhar Kaal Sarpa",
        "name_hi": "विषधर कालसर्प",
        "name_gu": "વિષધર કાલસર્પ",
        "sanskrit": "Vishdhar",
        "impact_area": "Gains, income, networks, aspirations",
        "impact_types": (
            "Fluctuating income, betrayal by friends or elder siblings, unfulfilled ambitions; "
            "gains possible through unconventional networks."
        ),
        "severity_baseline": "Moderate",
        "life_domains": ["gains", "friends", "aspirations"],
        "conventional_remedies": (
            "Thursday Jupiter charity, elder sibling respect rituals, "
            "Ganesh worship for obstacle removal, careful vow before new ventures."
        ),
        "modern_remedies": (
            "Diversify income sources, vet business partners carefully, "
            "network strategically, financial planning for income volatility."
        ),
        "positive_note": "Income can stabilize through networking and unconventional channels.",
    },
    {
        "house": 12,
        "name_en": "Sheshnag Kaal Sarpa",
        "name_hi": "शेषनाग कालसर्प",
        "name_gu": "શેષનાગ કાલસર્પ",
        "sanskrit": "Sheshnag",
        "impact_area": "Expenses, foreign lands, isolation, moksha",
        "impact_types": (
            "High expenditure, foreign settlement, sleep disorders, hidden losses; "
            "strong moksha potential after material struggles."
        ),
        "severity_baseline": "Moderate",
        "life_domains": ["expenses", "foreign", "spirituality"],
        "conventional_remedies": (
            "Ketu shanti puja, Nag Panchami vrat, meditation and moksha-oriented sadhana, "
            "foreign charity, donation to spiritual institutions."
        ),
        "modern_remedies": (
            "Sleep hygiene and sleep study if needed, expense tracking, "
            "therapy for isolation, structured spiritual practice with grounding habits."
        ),
        "positive_note": "Among the strongest types for spiritual liberation and detachment.",
    },
]

_BY_HOUSE: dict[int, TypeRow] = {row["house"]: row for row in _TYPES}


def type_lookup(rahu_house: int) -> TypeRow | None:
    return _BY_HOUSE.get(rahu_house)
