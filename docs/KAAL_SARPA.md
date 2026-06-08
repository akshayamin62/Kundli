# Kaal Sarpa Yoga — Feature Plan

> **Status:** Planning only — no implementation yet.  
> **Scope:** Detection, classification, impact text, mitigating factors, UI tab, and API — following the same architecture as Pitru Dosha.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Astrological Foundation](#2-astrological-foundation)
3. [Formation Rules (Detection Logic)](#3-formation-rules-detection-logic)
4. [The 12 Types of Kaal Sarpa](#4-the-12-types-of-kaal-sarpa)
5. [Yoga Presence (Binary)](#5-yoga-presence-binary)
6. [Mitigating Factors](#6-mitigating-factors)
   - [6.1 Shared Detection Primitives](#61-shared-detection-primitives)
   - [6.2 Mahapurusha Yoga — Parashari Rules (M3)](#62-mahapurusha-yoga--parashari-rules-m3)
   - [6.3 Raja Yoga — Parashari Rules (M2)](#63-raja-yoga--parashari-rules-m2)
   - [6.4 Affliction & Strength Grading](#64-affliction--strength-grading)
   - [6.5 Implementation Pseudocode](#65-implementation-pseudocode)
7. [Life Impact Areas by Type](#7-life-impact-areas-by-type)
8. [Remedies (Content Reference)](#8-remedies-content-reference)
9. [Integration with This Project](#9-integration-with-this-project)
10. [Backend Architecture Plan](#10-backend-architecture-plan)
11. [API Design](#11-api-design)
12. [Frontend / UI Plan](#12-frontend--ui-plan)
13. [Data Model](#13-data-model)
14. [Design Decisions to Finalize](#14-design-decisions-to-finalize)
15. [Implementation Phases](#15-implementation-phases)
16. [Testing Strategy](#16-testing-strategy)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Overview

**Kaal Sarpa Yoga** (also spelled *Kala Sarpa*, *Kaal Sarp*, *Kal Sarpa*) is a chart condition in Vedic astrology where **all seven classical grahas** — Sun, Moon, Mars, Mercury, Jupiter, Venus, and Saturn — lie on **one side** of the **Rahu–Ketu axis** in the birth chart (D1). Rahu is the serpent’s head; Ketu is the tail. When the remaining planets are “swallowed” within that half-circle, the yoga is said to be present.

Unlike **Pitru Dosha** (which scans many independent sign/house combinations from Excel), Kaal Sarpa is a **single global yoga** determined by one geometric condition on the zodiac circle, then **classified into one of 12 named types** based on which house Rahu occupies.

### Why add this feature?

| Reason | Detail |
|--------|--------|
| User demand | Kaal Sarpa is one of the most commonly asked-about yogas in Indian astrology consultations |
| Natural fit | The project already computes Rahu (`North Node`), Ketu (`South Node`), and all seven grahas with house/sign placement |
| Established pattern | Pitru Dosha proves the “detect on backend → enrich from data → show in result tab” workflow |
| Differentiation | Most free kundali tools show only “present/absent”; typed analysis with impacts adds real value |

### What this feature is NOT

- Not the same as **Kaalbal** (time-of-day planetary strength shown in Grahasheel Chakra)
- Not a match-compatibility dosha (unlike Mangal Dosha in Milan)
- Not dependent on Janma Rashi (Moon sign) alone — it is a whole-chart condition

---

## 2. Astrological Foundation

### Core concept

```
                    Zodiac circle (360°)
                         
              Ketu (tail) ●────────────● Rahu (head)
                         \            /
                          \  ALL 7   /
                           \ GRAHAS /
                            \ HERE /
                             \    /
                              ●──●
                         (empty half)
```

All seven grahas must fall entirely within **one semicircle** bounded by Rahu and Ketu. If **even one graha** crosses to the other side, Kaal Sarpa is **not present**. There is no partial or Anshik reporting — the result is strictly **present** or **not present** (see [Section 5](#5-yoga-presence-binary)).

### Grahas included

| Graha | Backend name in chart | Include? |
|-------|----------------------|----------|
| Sun | `Sun` | ✅ Yes |
| Moon | `Moon` | ✅ Yes |
| Mars | `Mars` | ✅ Yes |
| Mercury | `Mercury` | ✅ Yes |
| Jupiter | `Jupiter` | ✅ Yes |
| Venus | `Venus` | ✅ Yes |
| Saturn | `Saturn` | ✅ Yes |
| Rahu | `North Node` | ❌ Boundary (not counted) |
| Ketu | `South Node` | ❌ Boundary (not counted) |

**Not included:** Uranus, Neptune, Pluto (not in current ephemeris).

### Chart settings (align with project defaults)

| Setting | Project default | Recommendation |
|---------|-----------------|----------------|
| Zodiac | Sidereal (Lahiri) | Use chart as computed — Kaal Sarpa is Vedic |
| House system | Whole Sign | Type = Rahu’s **bhava number** (1–12) |
| Division | D1 (Rashi chart) | Detection on D1 only; D-9 may be noted as informational context, never as cancellation |

### Direction / orientation

Two arcs exist on the circle:

1. **Rahu → Ketu** (increasing longitude, mod 360°)
2. **Ketu → Rahu**

If all seven grahas lie in arc (1), yoga is formed with one orientation. If all lie in arc (2), yoga is formed with the opposite orientation. Only one orientation can satisfy “all inside” unless Rahu and Ketu are exactly opposite (180°) — in which case both arcs are equal semicircles and the condition is degenerate (rare edge case — treat as present if all grahas are in one sign-half).

---

## 3. Formation Rules (Detection Logic)

### Primary algorithm (proposed)

```
INPUT:  chart.planets[] with longitude (0–360) for each graha
        Rahu = "North Node", Ketu = "South Node"

STEP 1: Extract longitudes
        L_rahu, L_ketu, L_sun, L_moon, ... L_saturn

STEP 2: Define arc membership
        is_in_arc(L_p, L_start, L_end):
            Normalize all longitudes to [0, 360)
            If L_start <= L_end:  return L_start < L_p < L_end   (open interval)
            Else (wraps 360):     return L_p > L_start OR L_p < L_end

STEP 3: Check both arcs
        arc_rahu_ketu = all 7 grahas in arc(L_rahu, L_ketu)
        arc_ketu_rahu = all 7 grahas in arc(L_ketu, L_rahu)

        IF arc_rahu_ketu OR arc_ketu_rahu:
            present = true
            orientation = which arc matched
        ELSE:
            present = false   # binary only — no partial state

STEP 4: Classify type (if present)
        type = KAAL_SARPA_TYPES[rahu.house]   # 1–12

STEP 5: Evaluate mitigating factors (Section 6) — only when present=true
        mitigating_factors = evaluate_mitigations(chart)
        effective_severity = adjust_severity(base_severity, mitigating_factors)

STEP 6: Enrich from reference data
        impact, severity, remedies, house_themes = lookup(type)
```

### Planet exactly on Rahu/Ketu longitude

| Policy option | Recommendation |
|---------------|----------------|
| A — Strict open interval | Planet at exact node longitude is “outside” → may break full yoga |
| B — Same sign as node counts inside | More lenient; common in practitioner software |
| **Recommended for v1** | **B for same-sign; strict degree only if planet is in the opposite half by sign** |

Document the chosen rule in code comments and UI disclaimer.

### Inputs already available in `ChartResponse`

From existing chart pipeline (`chart_builder.py` → `ephemeris.py`):

- `planets[].longitude` — for arc math
- `planets[].house` — for type classification (Rahu’s house)
- `planets[].sign` — for display and mitigating-factor checks (Raja Yoga, Mahapurusha, etc.)
- `planets[].retrograde` — informational only (does not change arc membership)
- `angles.ascendant` — for Lagna strength and house-lord mitigations
- `meta.zodiac`, `meta.house_system` — must be echoed in response for transparency

---

## 4. The 12 Types of Kaal Sarpa

Type is determined **solely by Rahu’s house** in D1 (Whole Sign). Each type is named after a serpent from Hindu mythology.

| # | Sanskrit Name | English Name | Rahu in House | Ruling Theme |
|---|---------------|--------------|---------------|--------------|
| 1 | Anant Kaal Sarpa | Anant | 1st (Lagna) | Self, body, identity, overall life direction |
| 2 | Kulik Kaal Sarpa | Kulik | 2nd | Wealth, family, speech, food, values |
| 3 | Vasuki Kaal Sarpa | Vasuki | 3rd | Siblings, courage, communication, short travel |
| 4 | Shankhpal Kaal Sarpa | Shankhpal | 4th | Mother, home, property, vehicles, inner peace |
| 5 | Padma Kaal Sarpa | Padma | 5th | Children, education, creativity, romance, past merit |
| 6 | Mahapadma Kaal Sarpa | Mahapadma | 6th | Enemies, debts, disease, litigation, service |
| 7 | Takshak Kaal Sarpa | Takshak | 7th | Marriage, spouse, partnerships, business contracts |
| 8 | Karkotak Kaal Sarpa | Karkotak | 8th | Longevity, sudden events, inheritance, occult, chronic ailments |
| 9 | Shankhnaad Kaal Sarpa | Shankhnaad | 9th | Father, dharma, fortune, long journeys, higher learning |
| 10 | Ghatak Kaal Sarpa | Ghatak | 10th | Career, status, authority, public reputation |
| 11 | Vishdhar Kaal Sarpa | Vishdhar | 11th | Gains, income, elder siblings, networks, aspirations |
| 12 | Sheshnag Kaal Sarpa | Sheshnag | 12th | Expenses, losses, foreign lands, isolation, moksha, sleep |

### Type lookup key

```
type_id   = rahu_house          # integer 1–12
type_name = TYPES[type_id]      # e.g. "Anant Kaal Sarpa"
```

No separate lookup matrix is needed for classification — only for **impact text enrichment** (similar to Pitru’s Excel rows).

---

## 5. Yoga Presence (Binary)

Kaal Sarpa is **either present or not**. There is no partial (Anshik) state in this feature.

### Present (`present: true`)

- **All 7 grahas** lie within one Rahu–Ketu semicircle (either Rahu→Ketu or Ketu→Rahu arc)
- Type is classified from Rahu’s house (Section 4)
- Mitigating factors (Section 6) may reduce **severity of influence** but do **not** change `present`

### Not present (`present: false`)

- **Any graha** lies outside the enclosed arc, OR
- Grahas are split across both semicircles (≥1 on each side)

When not present, the UI shows a clear “Kaal Sarpa not present” state. No type name, impact card, or severity is assigned.

### Supplementary context (when present)

| Field | Purpose |
|-------|---------|
| `orientation` | `rahu_to_ketu` or `ketu_to_rahu` — which arc contains all grahas |
| Ketu house/sign | Shown alongside Rahu for context; does **not** reclassify type |
| `planets_inside` | All 7 grahas (always full list when present) |

### Explicitly excluded

| Concept | Handling |
|---------|----------|
| Partial / Anshik Kaal Sarpa | **Not supported** — 6 of 7 inside = not present |
| Dakshin vs Uttar variants | Defer — low priority |
| Type by Ketu house | Informational display only |

---

## 6. Mitigating Factors

When Kaal Sarpa **is present**, other chart strengths may **reduce its practical influence**. These are reported as `mitigating_factors[]` — they adjust **severity**, not whether the yoga exists.

**Important principles:**

1. **Mitigations never flip `present` to false.** Formation is purely geometric (Section 3).
2. **Do not use disputed or school-specific cancellation rules** (e.g. Rahu exaltation sign).
3. **D-9 status is informational only** — many astrologers do not use Navamsa to cancel Kaal Sarpa; we note it but do not treat it as cancellation.
4. Strong chart factors are often **more decisive than Kaal Sarpa itself** — the UI should present mitigations prominently when matched.

### Recommended mitigating factors for v1

| # | Factor | Detection (proposed) | Weight | Effect on severity |
|---|--------|----------------------|--------|-------------------|
| M1 | **Strong Jupiter** | Jupiter in Kendra (1,4,7,10) or Trikona (1,5,9) from Lagna; OR Jupiter in own/exaltation sign; OR Jupiter aspects Rahu/Ketu sign (7th aspect by sign) | High | Reduce severity — widely accepted mitigation |
| M2 | **Strong Raja Yogas** | Parashari Kendra + Trikona lord links — see [§6.3](#63-raja-yoga--parashari-rules-m2) | Very High | Significantly reduce Kaal Sarpa influence |
| M3 | **Multiple Mahapurusha Yogas** | 2+ of Pancha Mahapurusha — see [§6.2](#62-mahapurusha-yoga--parashari-rules-m3) | Very High | Among the strongest mitigations |
| M4 | **Strong Lagna** | Lagna lord in own/exaltation sign; Lagna lord in Kendra/Trikona; Lagna sign not afflicted by malefics in same sign | Very High | Very important — often outweighs Kaal Sarpa |
| M5 | **Strong Moon** | Moon in own/exaltation sign (Taurus, Cancer); Moon in Kendra/Trikona; Moon not conjunct Rahu/Ketu/Saturn | Very High | Very important for mental resilience and overall chart balance |
| M6 | **Strong 9th & 10th houses** | 9th and 10th lords strong (own/exaltation); benefics (Jupiter, Venus, Mercury) in 9th and/or 10th without malefic affliction | Very High | Fortune and career strength counterbalance serpent yoga |
| M7 | **Rahu in Upachaya** | Rahu in houses 3, 6, 10, or 11 | Moderate | Reduced severity — growth houses soften Rahu |
| M8 | **D-9 Kaal Sarpa note** *(informational)* | Recompute arc on D-9 inline; note whether yoga repeats in Navamsa | Low (info only) | **Does not cancel.** Optional note: “Navamsa also shows Kaal Sarpa” or “Navamsa does not repeat yoga” |

### Factors explicitly excluded

| Excluded rule | Reason |
|---------------|--------|
| **Exalted Rahu** (Taurus / Gemini / Virgo) | Highly disputed across schools; some texts assign no exaltation to Rahu. **Removed entirely.** |
| **D-9 broken ⇒ cancellation** | Not universally accepted; many astrologers never use Navamsa to cancel Kaal Sarpa. Listed as **M8 informational note only**. |
| **Bhanga / nullification rules** | No rule may set `present = false` after geometric detection |

### 6.1 Shared Detection Primitives

All yoga detection for M2 and M3 runs on **D1**, **Whole Sign** houses, **sidereal** signs — matching the chart the user already computed.

Reuse constants already established in `pitru_dosha.py` and `ChartWheel.tsx` dignity tables:

#### House groups (from Lagna)

| Group | Houses | Sanskrit |
|-------|--------|----------|
| **Kendra** | 1, 4, 7, 10 | Chatustaya |
| **Trikona** | 1, 5, 9 | Dharma trikona |
| **Upachaya** | 3, 6, 10, 11 | Growth houses |
| **Dusthana** | 6, 8, 12 | Difficult houses |

House 1 belongs to both Kendra and Trikona — the Lagna lord is therefore a natural Raja Yoga karaka.

#### Sign lords (Parashari)

| Sign | Lord |
|------|------|
| Aries, Scorpio | Mars |
| Taurus, Libra | Venus |
| Gemini, Virgo | Mercury |
| Cancer | Moon |
| Leo | Sun |
| Sagittarius, Pisces | Jupiter |
| Capricorn, Aquarius | Saturn |

#### Own signs (Swakshetra)

| Planet | Own signs |
|--------|-----------|
| Sun | Leo |
| Moon | Cancer |
| Mars | Aries, Scorpio |
| Mercury | Gemini, Virgo |
| Jupiter | Sagittarius, Pisces |
| Venus | Taurus, Libra |
| Saturn | Capricorn, Aquarius |

#### Exaltation (Uchcha) & debilitation (Neecha)

| Planet | Exaltation | Debilitation |
|--------|------------|--------------|
| Sun | Aries | Libra |
| Moon | Taurus | Scorpio |
| Mars | Capricorn | Cancer |
| Mercury | Virgo | Pisces |
| Jupiter | Cancer | Capricorn |
| Venus | Pisces | Virgo |
| Saturn | Libra | Aries |

#### House lord resolution (Whole Sign)

```
asc_sign     = chart.angles.ascendant.sign
sign_index   = ZODIAC_SIGNS.index(asc_sign)      # 0–11

sign_of_house(n)   = ZODIAC_SIGNS[(sign_index + n - 1) % 12]
lord_of_house(n)   = SIGN_LORDS[sign_of_house(n)]
planet_of_lord(n)  = planets[lord_of_house(n)]   # PlanetPosition dict
```

#### Conjunction (Yuti)

Two grahas are conjunct when they share the **same sign** (Whole Sign semantics — same rule as Pitru Dosha `_same_sign`).

#### Parivartana (Sign exchange)

Two house lords **A** (lord of house *hA*) and **B** (lord of house *hB*) are in mutual exchange when:

```
planet_A.sign == sign_of_house(hB)
AND
planet_B.sign == sign_of_house(hA)
```

#### Parashari Graha Drishti (house-based)

All grahas cast aspects by **house count from their occupied house** (matches `ChartWheel.tsx` / BPHS):

| Offset from occupied house | Default strength | Full-strength override |
|----------------------------|------------------|------------------------|
| 3rd | ¼ (ekpaad) | Saturn → **full** |
| 4th | ¾ (tripaad) | Mars → **full** |
| 5th | ½ (dwipaad) | Jupiter → **full** |
| 7th | **full** (sampurna) | — |
| 8th | ¾ (tripaad) | Mars → **full** |
| 9th | ½ (dwipaad) | Jupiter → **full** |
| 10th | ¼ (ekpaad) | Saturn → **full** |

**Planet A aspects Planet B** when A’s aspect list includes B’s house. For Raja Yoga, **mutual aspect** means A aspects B’s house AND B aspects A’s house (any strength counts).

#### Combustion (optional weakening — not blocking)

| Planet | Combust orb from Sun (degrees) |
|--------|-------------------------------|
| Moon | 12° |
| Mars | 17° |
| Mercury | 14° (retrograde Mercury: 12°) |
| Jupiter | 11° |
| Venus | 10° |
| Saturn | 15° |

Combustion **weakens** a yoga for strength grading ([§6.4](#64-affliction--strength-grading)) but does **not** prevent formation in v1.

---

### 6.2 Mahapurusha Yoga — Parashari Rules (M3)

**Source:** *Brihat Parashara Hora Shastra* (BPHS), *Phaladeepika*, *Saravali* — Pancha Mahapurusha Yogas.

A Mahapurusha Yoga forms when one of the five tara grahas (Mars, Mercury, Jupiter, Venus, Saturn) is:

1. Placed in a **Kendra** from Lagna (houses **1, 4, 7, or 10**), **AND**
2. Occupies its **own sign (Swakshetra)** or **exaltation sign (Uchcha)**.

Rahu, Ketu, Sun, and Moon do **not** form Mahapurusha Yogas.

#### The five yogas — exact conditions

| Yoga | Planet | Qualifying signs (own ∨ exaltation) | Kendra required |
|------|--------|-------------------------------------|-----------------|
| **Ruchaka** | Mars | Aries, Scorpio, Capricorn | 1, 4, 7, or 10 |
| **Bhadra** | Mercury | Gemini, Virgo | 1, 4, 7, or 10 |
| **Hamsa** | Jupiter | Sagittarius, Pisces, Cancer | 1, 4, 7, or 10 |
| **Malavya** | Venus | Taurus, Libra, Pisces | 1, 4, 7, or 10 |
| **Shasha** | Saturn | Capricorn, Aquarius, Libra | 1, 4, 7, or 10 |

#### Detection function

```
def detect_mahapurusha(planets) -> list[MahapurushaFinding]:
    KENDRA = {1, 4, 7, 10}
    RULES = {
        "Mars":    ("Ruchaka",  {"Aries", "Scorpio", "Capricorn"}),
        "Mercury": ("Bhadra",   {"Gemini", "Virgo"}),
        "Jupiter": ("Hamsa",    {"Sagittarius", "Pisces", "Cancer"}),
        "Venus":   ("Malavya",  {"Taurus", "Libra", "Pisces"}),
        "Saturn":  ("Shasha",   {"Capricorn", "Aquarius", "Libra"}),
    }
    findings = []
    for planet_name, (yoga_name, qualifying_signs) in RULES.items():
        p = planets[planet_name]
        if p.house in KENDRA and p.sign in qualifying_signs:
            findings.append({
                "yoga": yoga_name,
                "planet": planet_name,
                "house": p.house,
                "sign": p.sign,
                "dignity": "exaltation" if p.sign == EXALTATION[planet_name]
                          else "own_sign",
            })
    return findings
```

#### M3 mitigation threshold

| Count | M3 `matched` | Detail label |
|-------|--------------|--------------|
| 0–1 Mahapurusha | `false` | List any single yoga found (informational) |
| **≥ 2 Mahapurusha** | **`true`** | `"Ruchaka + Hamsa"` etc. |

#### Notes & edge cases

| Topic | Project rule |
|-------|--------------|
| **Moolatrikona** | Optional v2 enhancement using planet degrees within sign; v1 uses **whole-sign** own/exaltation only |
| **Retrograde** | Does **not** cancel Mahapurusha (retrograde exalted Jupiter in Kendra still forms Hamsa) |
| **Same planet, one yoga** | Each planet contributes at most **one** Mahapurusha entry |
| **Conjunct Rahu/Ketu** | Yoga **still forms** geometrically; strength downgraded in [§6.4](#64-affliction--strength-grading) |
| **Bhadra + combustion** | Mercury combust near Sun still forms Bhadra if sign/house qualify; flagged as `strength: weak` |

---

### 6.3 Raja Yoga — Parashari Rules (M2)

**Source:** BPHS Ch. 35–41, *Phaladeepika* Ch. 6, *Jataka Parijata*.

**Core definition (BPHS):** Raja Yoga arises when **Kendra lords** and **Trikona lords** associate by **conjunction**, **mutual aspect**, or **Parivartana** (sign exchange).

```
Kendra houses  = {1, 4, 7, 10}
Trikona houses = {1, 5, 9}
```

Because house 1 is both Kendra and Trikona, the **Lagna lord (1st lord)** paired with the **5th lord** or **9th lord** is the most common Raja Yoga pattern.

#### Step 1 — Enumerate lord pairs to test

Test every **Kendra lord** × **Trikona lord** pair where the two houses are **distinct** (skip 1×1):

| Kendra house | Trikona house | Pair label |
|--------------|---------------|------------|
| 1 | 5 | Lagnadhipati + Putra lord |
| 1 | 9 | Lagnadhipati + Dharma lord |
| 4 | 5 | Bandhu + Putra |
| 4 | 9 | Bandhu + Dharma |
| 7 | 5 | Yuvati + Putra |
| 7 | 9 | Yuvati + Dharma |
| 10 | 5 | Karma + Putra |
| 10 | 9 | Karma + Dharma |

When the same planet rules both a Kendra and Trikona (e.g. Mars for Aries Lagna rules 1 and 8 — 8 is not Trikona; for Cancer Lagna, Mars rules 5 and 10), treat that planet as a **self-connected Raja Yoga karaka** if it occupies a Kendra **or** Trikona house in own/exaltation/friendly dignity — see **Single-lord Raja Yoga** below.

#### Step 2 — Connection types (any one qualifies)

For lords **A** = lord of Kendra house *k*, **B** = lord of Trikona house *t*:

| Type | Code | Condition |
|------|------|-----------|
| **Conjunction** | `yuti` | `planet_A.sign == planet_B.sign` |
| **Parivartana** | `parivartana` | `planet_A.sign == sign_of_house(t)` AND `planet_B.sign == sign_of_house(k)` |
| **Mutual aspect** | `mutual_drishti` | A aspects B’s house AND B aspects A’s house (Parashari table, [§6.1](#61-shared-detection-primitives)) |
| **One-sided aspect** | `single_drishti` | Only A aspects B’s house OR B aspects A’s house — **weaker**; counts for M2 only if lords are unafflicted |

#### Step 3 — Special named Raja Yogas (always test)

These are high-weight subsets that should be surfaced by name in `detail`:

| Yoga name | Condition | Notes |
|-----------|-----------|-------|
| **Dharma-Karmadhipati Yoga** | 9th lord + 10th lord connected (`yuti`, `parivartana`, or `mutual_drishti`) | 10th is Kendra, 9th is Trikona — one of the strongest combinations |
| **Lagnadhipati + Trine lord** | 1st lord + 5th lord OR 1st lord + 9th lord connected | Classic Raja Yoga |
| **Kendra-Trine exchange** | Any Kendra lord in Trikona sign AND corresponding Trikona lord in Kendra sign | Parivartana subtype |

#### Step 4 — Single-lord Raja Yoga (dual lordship)

When **one planet rules both a Kendra house and a Trikona house** (distinct houses), it becomes a self-sufficient Raja Yoga karaka without needing a second lord.

**Derive at runtime** (do not hardcode incomplete tables):

```
for each planet P:
    houses_ruled = [h for h in 1..12 if lord_of_house(h) == P]
    kendra_ruled = houses_ruled ∩ {1, 4, 7, 10}
    trikona_ruled = houses_ruled ∩ {1, 5, 9}

    if kendra_ruled and trikona_ruled:
        # P is dual lord — e.g. Mars for Cancer Lagna rules 5 (T) and 10 (K)
        if P is not debilitated and P.house in (kendra_ruled ∪ trikona_ruled):
            record Single-lord Raja Yoga(P, kendra_ruled, trikona_ruled)
```

**Examples (verified):**

| Lagna | Planet | Kendra ruled | Trikona ruled |
|-------|--------|--------------|---------------|
| Cancer | Mars | 10 | 5 |
| Leo | Mars | 4 | 9 |
| Taurus | Saturn | 10 | 9 |
| Libra | Saturn | 4 | 5 |
| Capricorn | Venus | 10 | 5 |
| Sagittarius | Jupiter | 4 | 1 (also rules 1) |

When house 1 is involved, the Lagna lord already forms Raja Yoga by occupying a Kendra/Trikona — test via the standard pair loop (1+5, 1+9) as well.

#### M2 mitigation threshold

| Condition | M2 `matched` | `strength` field |
|-----------|--------------|------------------|
| No Kendra–Trikona link found | `false` | — |
| Link found but **both lords afflicted** ([§6.4](#64-affliction--strength-grading)) | `false` | — |
| **1 unafflicted** link (any type) | **`true`** | `moderate` |
| **Dharma-Karmadhipati** unafflicted | **`true`** | `strong` |
| **≥ 2 unafflicted** links OR D-K + another | **`true`** | `very_strong` |

#### Raja Yoga detection function (outline)

```
def detect_raja_yogas(chart) -> list[RajaYogaFinding]:
    findings = []
    kendra_houses  = [1, 4, 7, 10]
    trikona_houses = [1, 5, 9]

    # A) Dual-lordship single-planet Raja Yogas
    for entry in dual_lordship_for_lagna(chart):
        findings += check_single_lord_raja(entry, chart)

    # B) Kendra × Trikona lord pairs
    for k in kendra_houses:
        for t in trikona_houses:
            if k == t == 1:
                continue   # test 1+5 and 1+9 separately below
            lord_k = planet_of_lord(k)
            lord_t = planet_of_lord(t)
            if lord_k.name == lord_t.name:
                continue   # handled by dual-lordship
            link = find_connection(lord_k, lord_t, k, t, chart)
            if link:
                findings.append(build_finding(k, t, lord_k, lord_t, link))

    # C) Explicit 1+5 and 1+9 (Lagnadhipati pairs)
    for t in [5, 9]:
        link = find_connection(planet_of_lord(1), planet_of_lord(t), 1, t, chart)
        if link:
            findings.append(build_finding(1, t, ..., link))

    # D) Tag Dharma-Karmadhipati if 9th+10th lords connected
    tag_dharma_karmadhipati(findings, chart)

    return findings
```

#### Response sub-object (`raja_yogas[]`)

Each detected yoga is returned for UI transparency (independent of M2 boolean):

```json
{
  "yoga_name": "Dharma-Karmadhipati Yoga",
  "kendra_house": 10,
  "trikona_house": 9,
  "lords": ["Saturn", "Jupiter"],
  "connection": "parivartana",
  "afflicted": false,
  "strength": "strong"
}
```

---

### 6.4 Affliction & Strength Grading

Yogas may **form geometrically** but be ** weakened** by affliction. M2 and M3 mitigation uses **unafflicted** yogas only.

#### Affliction definition (align with `pitru_dosha._afflicted`)

A graha is **afflicted** when **any** of:

| # | Condition |
|---|-----------|
| A1 | In **debilitation** sign |
| A2 | In **same sign** as Rahu, Ketu, or Saturn (conjunction by sign) |
| A3 | **Combust** — within combustion orb of Sun ([§6.1](#61-shared-detection-primitives)) |

Rahu/Ketu conjunction is the most relevant in Kaal Sarpa charts because nodes already dominate the chart.

#### Strength tiers for formed yogas

| Tier | Criteria | Used for |
|------|----------|----------|
| **Strong** | Not afflicted; planet in own or exaltation; in Kendra (Mahapurusha) or both lords in Kendra/Trikona (Raja) | Full mitigation credit |
| **Moderate** | Not afflicted; neutral/friendly sign; yoga forms | Partial mitigation credit |
| **Weak** | Afflicted OR combust OR in dusthana (6, 8, 12) | Listed in response but **does not** count toward M2/M3 `matched` |

#### M2 / M3 summary mapping

```
M2 matched  = any RajaYogaFinding with strength in {moderate, strong, very_strong}
              AND afflicted == false for both participating lords

M3 matched  = count(MahapurushaFinding where strength != weak) >= 2
```

---

### 6.5 Implementation Pseudocode

Full pipeline invoked from `calculate_kaal_sarpa` when `present == true`:

```
def evaluate_mitigations(chart) -> list[Mitigation]:
    by = _planets(chart)                    # reuse pitru pattern; map nodes
    mahapurushas = detect_mahapurusha(by)
    raja_yogas   = detect_raja_yogas(chart)

    results = []

    # M2 — Raja Yoga
    strong_raja = [y for y in raja_yogas if not y.afflicted and y.strength >= MODERATE]
    results.append({
        "factor": "Strong Raja Yogas",
        "matched": len(strong_raja) >= 1,
        "detail": format_raja_detail(strong_raja),
        "weight": "very_high",
        "sub_findings": raja_yogas,
    })

    # M3 — Mahapurusha (need 2+)
    strong_mp = [m for m in mahapurushas if m.strength != WEAK]
    results.append({
        "factor": "Multiple Mahapurusha Yogas",
        "matched": len(strong_mp) >= 2,
        "detail": "+".join(m.yoga for m in strong_mp) or "None",
        "weight": "very_high",
        "sub_findings": mahapurushas,
    })

    # M1, M4–M8 ... (existing rules)
    return results
```

#### Shared module layout (implementation phase)

| Module | Contents |
|--------|----------|
| `backend/app/services/yoga_detection.py` | Shared primitives, Mahapurusha, Raja Yoga — reusable beyond Kaal Sarpa |
| `backend/app/services/kaal_sarpa.py` | Kaal Sarpa arc + calls `yoga_detection` for mitigations |

Centralize `SIGN_LORDS`, `EXALTATION`, `DEBILITATION`, `KENDRA`, `TRIKONA`, aspect helpers in `yoga_detection.py` to avoid duplicating `pitru_dosha.py` constants.

Derive dual-lordship Raja Yogas **mechanically** at runtime via `houses_ruled_by(planet)` — no hand-maintained Lagna lookup table.

---

### Severity adjustment

```
base_severity       = severity_baseline(type)     # from type data, Section 7
effective_severity  = adjust(base_severity, matched_mitigations)

Reduction tiers (example):
  0 mitigations matched     → base severity unchanged
  1–2 moderate mitigations  → drop one level (e.g. Very High → High)
  3+ strong mitigations     → drop two levels or label "Mitigated"
  M2 + M3 + M4 matched      → label "Strongly Mitigated" regardless of type baseline
```

### Response field shape

Each item in `mitigating_factors[]`:

```json
{
  "factor": "Strong Raja Yogas",
  "matched": true,
  "detail": "9th lord Jupiter and 10th lord Mars in mutual Kendra",
  "weight": "very_high",
  "severity_reduction": "significant"
}
```

### UI presentation

- When **not present**: single clear message, no mitigation section required.
- When **present**: show type + base impact, then a dedicated **“Mitigating Factors”** section listing matched/unmatched factors.
- Use copy such as: *“Kaal Sarpa is present, but strong chart combinations may significantly reduce its effects.”*
- Never use language implying the yoga was “cancelled” or “nullified” — only **mitigated**.

### Disclaimer (required in API + UI)

> Kaal Sarpa analysis is interpretive. Formation uses a strict geometric rule on D1 (all seven grahas between Rahu and Ketu). Mitigating factors reduce reported severity but do not remove the yoga. Different schools disagree on exact orb boundaries and factor weighting. Consult a qualified Jyotishi for personalized guidance.

---

## 7. Life Impact Areas by Type

Reference content for the data file / Excel sheet. Each type maps to primary life domains and typical challenges (not deterministic predictions).

### 7.1 Anant (Rahu in 1st)

| Domain | Typical indications |
|--------|---------------------|
| Self & health | Identity confusion, self-doubt, health fluctuations, head/face-related concerns |
| Personality | Strong inner drive but outward obstacles; tendency to reinvent self |
| Life path | Delayed recognition; success after sustained effort post-36 |
| **Severity baseline** | High |

### 7.2 Kulik (Rahu in 2nd)

| Domain | Typical indications |
|--------|---------------------|
| Wealth | Financial instability, unexpected expenses, difficulty accumulating savings |
| Family | Family discord, ancestral property disputes, speech-related misunderstandings |
| Food/speech | Harsh speech, dietary imbalances |
| **Severity baseline** | High |

### 7.3 Vasuki (Rahu in 3rd)

| Domain | Typical indications |
|--------|---------------------|
| Siblings | Strained sibling relations, competition |
| Courage | Bold plans but hidden fears; effort-heavy success |
| Communication | Miscommunication, rumors, media/legal writing issues |
| **Severity baseline** | Moderate–High |

### 7.4 Shankhpal (Rahu in 4th)

| Domain | Typical indications |
|--------|---------------------|
| Home/mother | Domestic unrest, mother’s health concerns, frequent relocations |
| Property | Delays in property/vehicle purchase |
| Mental peace | Inner restlessness, disturbed peace of mind |
| **Severity baseline** | High |

### 7.5 Padma (Rahu in 5th)

| Domain | Typical indications |
|--------|---------------------|
| Children | Delays or worries related to progeny; speculative losses |
| Education | Interrupted or non-linear education path |
| Romance | Complicated love life, breakups |
| **Severity baseline** | Moderate–High |

### 7.6 Mahapadma (Rahu in 6th)

| Domain | Typical indications |
|--------|---------------------|
| Enemies/debt | Legal battles, loans, workplace politics |
| Health | Chronic or hard-to-diagnose ailments |
| Service | Success through competition — Rahu in 6 can also give victory over enemies |
| **Severity baseline** | Moderate (mixed — upachaya house) |

### 7.7 Takshak (Rahu in 7th)

| Domain | Typical indications |
|--------|---------------------|
| Marriage | Delayed marriage, marital discord, partner health issues |
| Business | Partnership breakups, contract disputes |
| Public dealings | Legal separations, trust issues |
| **Severity baseline** | Very High |

### 7.8 Karkotak (Rahu in 8th)

| Domain | Typical indications |
|--------|---------------------|
| Longevity | Sudden life changes, accidents (fear factor in texts) |
| Inheritance | Disputes over wills, shared resources |
| Occult | Interest in hidden sciences; psychological depth |
| **Severity baseline** | Very High |

### 7.9 Shankhnaad (Rahu in 9th)

| Domain | Typical indications |
|--------|---------------------|
| Father/dharma | Distance from father or guru; ideological conflicts |
| Luck | Fortune through foreign/unconventional paths |
| Religion | Questioning tradition; spiritual seeking after struggle |
| **Severity baseline** | High |

### 7.10 Ghatak (Rahu in 10th)

| Domain | Typical indications |
|--------|---------------------|
| Career | Unstable career, sudden rises and falls, authority conflicts |
| Reputation | Public scandal risk, government/legal entanglements |
| Status | Hard-won recognition |
| **Severity baseline** | High |

### 7.11 Vishdhar (Rahu in 11th)

| Domain | Typical indications |
|--------|---------------------|
| Gains | Fluctuating income; gains through unconventional networks |
| Friends | Betrayal by friends or elder siblings |
| Desires | Unfulfilled ambitions despite effort |
| **Severity baseline** | Moderate |

### 7.12 Sheshnag (Rahu in 12th)

| Domain | Typical indications |
|--------|---------------------|
| Expenses | High expenditure, foreign settlement, sleep disorders |
| Losses | Hidden losses, hospitalization, isolation |
| Spirituality | Strong moksha potential after material struggles |
| **Severity baseline** | Moderate–High |

### General cross-type effects (show in all types)

- Periods of Rahu Mahadasha / Antardasha may intensify effects
- Transits of Rahu/Ketu over natal nodes or Lagna — note in “timing” section (future)
- Kaal Sarpa is often said to affect most in first half of life, easing after Rahu maturity (~42 years) — informational only

---

## 8. Remedies (Content Reference)

Store as optional fields in reference data — display in UI under “Suggested Remedies” (not medical/legal advice).

### Universal remedies (all types)

| Category | Remedy |
|----------|--------|
| Worship | Regular Shiva puja (Kaal Sarpa is linked to serpent energy); visit Trimbakeshwar or other Kaal Sarpa temples |
| Mantra | `Om Namah Shivaya`; Rahu mantra: `Om Ram Rahave Namah`; Ketu: `Om Kem Ketave Namah` |
| Fasting | Nag Panchami vrat |
| Charity | Donate to serpent/naga idols, feed birds, help elderly on Saturdays |
| Gemstones | **Do not auto-recommend** — gem therapy is chart-specific; show disclaimer |

### Type-specific remedies (examples for data file)

| Type | Sample remedy theme |
|------|---------------------|
| Anant | Self-care, health routines, Monday Shiva fasting |
| Kulik | Family harmony rituals, speech discipline, Friday Lakshmi puja |
| Takshak | Marriage counseling, Venus/Rahu shanti, couple temple visit |
| Sheshnag | Meditation, foreign charity, Ketu shanti puja |

---

## 9. Integration with This Project

### Existing assets to reuse

| Asset | Reuse for Kaal Sarpa |
|-------|---------------------|
| `ChartResponse` with planet longitudes/houses | Primary detection input |
| `North Node` / `South Node` naming | Map to Rahu/Ketu in service layer (same as Pitru) |
| `POST /chart/calculate` flow | User already has chart before analysis tab |
| `PitruDoshaPanel` UI pattern | Card layout, severity pills, i18n, loading states |
| `varga.py` / `/chart/varga` | Optional D-9 note for M8 (informational only) |
| `result/page.tsx` tab system | Add `"kaalsarpa"` tab |
| `translations.ts` | Sign/planet name localization |

### New assets to create (when implementing)

| File | Purpose |
|------|---------|
| `backend/app/services/yoga_detection.py` | Shared Parashari yoga primitives — Raja, Mahapurusha, aspects, lordship |
| `backend/app/services/kaal_sarpa.py` | Kaal Sarpa arc + mitigations |
| `backend/app/data/kaal_sarpa_data.py` | Type impacts, severity, remedies (embedded) |
| `backend/scripts/build_kaal_sarpa_data.py` | Optional: Excel → Python generator |
| `Kaal_Sarpa_Types_Impacts_and_Remedies.xlsx` | Optional source spreadsheet |
| `docs/KAAL_SARPA.md` | This document |
| `frontend/src/components/KaalSarpaPanel.tsx` | Result tab UI |
| Schema additions in `schemas.py` + `chart.ts` | Response types |
| API route in `chart.py` | `POST /chart/kaal-sarpa` |
| `api.ts` | `calculateKaalSarpa(chart)` client function |

### Flow (mirrors Pitru Dosha)

```
Birth chart (D1) via POST /api/chart/calculate
    │
    ▼
User opens "Kaal Sarpa" tab on /result
    │
    ▼
Frontend sends full ChartResponse JSON
    │
    ▼
POST /api/chart/kaal-sarpa
    │
    ├─► Arc detection (all 7 grahas between Rahu–Ketu? → present true/false)
    ├─► Type classification (Rahu house → 1 of 12 types, if present)
    ├─► Mitigating factors (Raja Yoga, Mahapurusha, Lagna, Moon, 9th/10th, Jupiter, etc.)
    └─► Enrich from kaal_sarpa_data.py
    │
    ▼
KaalSarpaPanel renders status + type details + mitigating factors + disclaimer
```

---

## 10. Backend Architecture Plan

### Service: `kaal_sarpa.py`

```
calculate_kaal_sarpa(chart: dict) -> dict

Internal helpers:
  _planet_longitudes(chart) -> dict[str, float]
  _is_in_arc(lon, start, end) -> bool
  _all_grahas_in_arc(chart, start, end) -> bool
  _detect_presence(chart) -> bool              # binary only
  _classify_type(rahu_house) -> TypeInfo
  _evaluate_mitigations(chart) -> list[Mitigation]
  _detect_raja_yogas(chart) -> list[RajaYogaFinding]   # §6.3
  _detect_mahapurusha_yogas(chart) -> list[MahapurushaFinding]  # §6.2
  _is_afflicted(planet, by) -> bool                    # §6.4, reuse pitru logic
  _mutual_aspect(lord_a, lord_b) -> bool               # §6.1 Graha Drishti
  _parivartana(lord_a, lord_b, house_a, house_b) -> bool
  _houses_ruled_by(planet, chart) -> list[int]
  _assess_lagna_strength(chart) -> bool
  _assess_moon_strength(chart) -> bool
  _assess_9th_10th_strength(chart) -> bool
  _navamsa_kaal_sarpa_note(chart) -> str     # informational only (M8)
  _effective_severity(base, mitigations) -> str
```

### Reference data: `kaal_sarpa_data.py`

Structure (one row per type):

```python
TypeRow = {
    "house": 1,
    "name_en": "Anant Kaal Sarpa",
    "name_hi": "अनन्त कालसर्प",
    "name_gu": "અનંત કાલસર્પ",
    "sanskrit": "Anant",
    "primary_themes": "...",
    "general_impact": "...",
    "severity_baseline": "High",
    "life_domains": ["self", "health", "identity"],
    "remedies": "...",
    "positive_note": "...",   # e.g. spiritual growth potential for Sheshnag
}

type_lookup(rahu_house: int) -> TypeRow
```

Optional Excel columns for spreadsheet authoring:

| Column | Description |
|--------|-------------|
| `house` | 1–12 |
| `type_name` | English name |
| `sanskrit` | Sanskrit name |
| `primary_themes` | Short bullet themes |
| `general_impact` | Long-form impact text |
| `severity_baseline` | Very High / High / Moderate / Low |
| `life_domains` | Comma-separated tags |
| `remedies` | Remedy text |
| `positive_note` | Balanced perspective |
| `name_hi`, `name_gu` | i18n names |

Regenerate after Excel changes:

```bash
python backend/scripts/build_kaal_sarpa_data.py
```

---

## 11. API Design

### Endpoint

```
POST /api/chart/kaal-sarpa
Authorization: Bearer <JWT>   (same as other chart routes)
Content-Type: application/json
Body: full ChartResponse JSON (same pattern as pitru-dosha)
```

### Response shape (proposed)

```json
{
  "present": true,
  "type": {
    "house": 7,
    "name": "Takshak Kaal Sarpa",
    "sanskrit": "Takshak"
  },
  "orientation": "rahu_to_ketu",
  "rahu": { "sign": "Libra", "house": 7, "longitude": 185.4 },
  "ketu": { "sign": "Aries", "house": 1, "longitude": 5.4 },
  "planets_inside": ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
  "base_severity": "Very High",
  "effective_severity": "Moderate",
  "general_impact": "...",
  "primary_themes": ["marriage", "partnerships", "legal"],
  "remedies": "...",
  "positive_note": "...",
  "mitigating_factors": [
    {
      "factor": "Strong Jupiter",
      "matched": true,
      "detail": "Jupiter in 5th house, own sign",
      "weight": "high",
      "severity_reduction": "moderate"
    },
    {
      "factor": "Strong Raja Yogas",
      "matched": true,
      "detail": "Dharma-Karmadhipati Yoga (9th lord Jupiter + 10th lord Mars, parivartana)",
      "weight": "very_high",
      "severity_reduction": "significant",
      "raja_yogas": [
        {
          "yoga_name": "Dharma-Karmadhipati Yoga",
          "kendra_house": 10,
          "trikona_house": 9,
          "lords": ["Mars", "Jupiter"],
          "connection": "parivartana",
          "afflicted": false,
          "strength": "strong"
        }
      ]
    },
    {
      "factor": "Multiple Mahapurusha Yogas",
      "matched": true,
      "detail": "Hamsa + Malavya",
      "weight": "very_high",
      "severity_reduction": "significant",
      "mahapurusha_yogas": [
        { "yoga": "Hamsa", "planet": "Jupiter", "house": 4, "sign": "Cancer", "dignity": "exaltation", "strength": "strong" },
        { "yoga": "Malavya", "planet": "Venus", "house": 10, "sign": "Pisces", "dignity": "exaltation", "strength": "strong" }
      ]
    },
    {
      "factor": "D-9 Kaal Sarpa note",
      "matched": false,
      "detail": "Navamsa does not repeat Kaal Sarpa",
      "weight": "low",
      "severity_reduction": "none"
    }
  ],
  "disclaimer": "..."
}
```

When `present` is `false`, return minimal payload:

```json
{
  "present": false,
  "type": null,
  "disclaimer": "..."
}
```

### Presence rule

| `present` | Condition |
|-----------|-----------|
| `true` | All 7 grahas inside one Rahu–Ketu semicircle |
| `false` | Any graha outside, or grahas split across both semicircles |

---

## 12. Frontend / UI Plan

### New tab on `/result`

Add to `MainTab` type: `"kaalsarpa" | ...`

Tab label (i18n):

| Lang | Label |
|------|-------|
| en | Kaal Sarpa |
| hi | काल सर्प |
| gu | કાલ સર્પ |

### Component: `KaalSarpaPanel.tsx`

Follow `PitruDoshaPanel.tsx` conventions:

| UI section | Content |
|------------|---------|
| **Header** | Title + status badge (`Present` / `Not Present`) |
| **Summary card** | Type name, Rahu house/sign, Ketu house/sign, orientation *(only when present)* |
| **Severity pill** | `base_severity` vs `effective_severity` after mitigations |
| **Impact body** | General impact, primary themes (tags or bullets) |
| **Mitigating factors** | Prominent section — matched factors with detail; expand M2/M3 to show `raja_yogas[]` / `mahapurusha_yogas[]` sub-lists |
| **Remedies** | Optional section with disclaimer |
| **Disclaimer** | Footer text from API |

### Visual enhancement (optional v2)

- Highlight Rahu–Ketu axis on `ChartWheel.tsx` when Kaal Sarpa tab is active
- Shade the “serpent half” of the chart wheel

### PDF report

Add Kaal Sarpa section to `reportGenerator.ts` when feature ships (currently Pitru is also not in PDF — can batch both later).

---

## 13. Data Model

### Backend (`schemas.py`)

```
KaalSarpaTypeInfo
KaalSarpaNodeInfo
RajaYogaFinding          # §6.3
MahapurushaFinding       # §6.2
KaalSarpaMitigation
KaalSarpaResponse
```

### Frontend (`types/chart.ts`)

Mirror backend interfaces (same as Pitru pattern).

### Key fields

| Field | Type | Description |
|-------|------|-------------|
| `present` | bool | All 7 grahas inside one semicircle — binary only |
| `type` | object \| null | Named type from Rahu house; null when not present |
| `orientation` | string | Which arc contains all grahas |
| `planets_inside` | string[] | All 7 grahas when present |
| `base_severity` | string | From type baseline (Section 7) |
| `effective_severity` | string | After mitigating factors applied |
| `mitigating_factors` | array | Matched/unmatched mitigation results |

---

## 14. Design Decisions to Finalize

Before implementation, product/astrology stakeholders should confirm:

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| D1 | Include Moon in 7 grahas? | Yes / No | **Yes** (standard Parashari) |
| D2 | Planet conjunct Rahu/Ketu (same sign) | Inside / Outside | **Inside** |
| D3 | Partial / Anshik reporting | Yes / No | **No** — binary present/absent only |
| D4 | D-9 and Kaal Sarpa | Cancel / Mitigate / Ignore | **Informational note only (M8)** — never cancels |
| D5 | Severity adjustment | Rule-based / manual text only | **Rule-based** via `mitigating_factors[]` |
| D6 | Hindi/Gujarati impact text | Full translation / English only initially | **Names + labels i18n; impact EN first**, HI/GU in Excel later |
| D7 | Kaal Sarpa in Match (Milan) | Yes / No | **Defer** — not traditional Milan factor |
| D8 | Embed in `/chart/calculate` | Separate endpoint / inline | **Separate endpoint** (Pitru pattern, lazy load) |
| D9 | Rahu exaltation as factor | Include / Exclude | **Exclude** — too disputed across schools |

---

## 15. Implementation Phases

### Phase 1 — Core detection (MVP)

- [ ] `kaal_sarpa.py` with arc detection + 12-type classification
- [ ] Hardcoded type impact dict (12 rows minimum)
- [ ] Pydantic schema + `POST /chart/kaal-sarpa`
- [ ] Basic `KaalSarpaPanel` (present/absent + type name + impact)
- [ ] Tab on result page

### Phase 2 — Rich analysis

- [ ] `yoga_detection.py` — Mahapurusha (§6.2) + Raja Yoga (§6.3) + affliction grading (§6.4)
- [ ] Mitigating factors M1–M8 wired through `evaluate_mitigations`
- [ ] Excel data file + build script
- [ ] Severity adjustment logic + mitigation UI
- [ ] HI/GU type names

### Phase 3 — Polish

- [ ] Chart wheel axis highlighting
- [ ] PDF report section
- [ ] Dasha timing note (Rahu periods)
- [ ] HI/GU full impact text

---

## 16. Testing Strategy

### Unit tests (`backend/tests/test_kaal_sarpa.py`)

| Test case | Expected |
|-----------|----------|
| All grahas between Rahu→Ketu | `present=true`, correct orientation |
| All grahas between Ketu→Rahu | `present=true`, opposite orientation |
| One graha outside | `present=false` (no partial state) |
| Two grahas on opposite sides | `present=false` |
| Rahu in 7th with all inside | `present=true`, `type=Takshak` |
| **Ruchaka Yoga** — Mars in Capricorn, 10th house | `mahapurusha_yogas` contains Ruchaka, strength strong |
| **Hamsa + Malavya** both in Kendra, own/exaltation | M3 `matched=true` |
| **Only 1 Mahapurusha** (e.g. Shasha alone) | M3 `matched=false`; yoga still listed |
| **Dharma-Karmadhipati** — 9th+10th lords in parivartana | M2 `matched=true`, strength strong |
| **Kendra+Trikona lords conjunct**, unafflicted | M2 `matched=true` |
| Raja Yoga lords both conjunct Rahu (same sign) | yoga listed, `afflicted=true`, M2 `matched=false` |
| **Dual-lord Mars** (Cancer Lagna, Mars rules 5+10) in Kendra | Single-lord Raja Yoga detected |
| Strong Raja Yoga + Kaal Sarpa | `present=true`, `effective_severity` reduced |
| D-9 does not repeat yoga | M8 note only — `present` unchanged |
| Known celebrity/chart fixtures | Match published Kaal Sarpa status (regression) |

### Manual QA

- Compare 5–10 known charts with established astrology software (JHora, AstroSage, etc.)
- Verify Whole Sign house numbers match type classification
- Test all three UI languages for labels

---

## 17. Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Kaal Amrita Yoga** | Opposite condition — all grahas outside the Rahu–Ketu arc (auspicious variant) |
| **Transit alerts** | Notify when transiting Rahu/Ketu align with natal serpent |
| **Dasha integration** | Flag active Rahu/Ketu Vimshottari periods on Kaal Sarpa panel |
| **Milan module** | Optional: both partners have Kaal Sarpa → compatibility note |
| **Divisional charts** | Optional D-9 Kaal Sarpa note (informational, not cancellation) |
| **Chart wheel overlay** | Animated serpent arc on North Indian chart |

---

## Appendix A — Quick Comparison: Pitru Dosha vs Kaal Sarpa

| Aspect | Pitru Dosha | Kaal Sarpa |
|--------|-------------|------------|
| Detection | Many independent combinations | One global geometric condition |
| Classification | Per finding (sign/house combo) | Single type (Rahu house 1–12) |
| Data source | Large Excel (59+ sign, 41+ house rows) | Small Excel (12 type rows + remedies) |
| Multiple findings | Yes — many cards | No — one summary card |
| Partial forms | N/A | **Not supported** — binary present/absent |
| Severity adjustment | Per-row severity from matrix | `mitigating_factors[]` reduce effective severity |
| Varga use | D-9/D-12 for Sun weakness | D-9 informational note only (M8) |

---

## Appendix B — Sample API Request

The frontend already stores the chart in session after calculation. The Kaal Sarpa tab sends that same object:

```
POST /api/chart/kaal-sarpa
Body: <ChartResponse from POST /api/chart/calculate>
```

No re-geocoding or re-computation of ephemeris is required.

---

## Appendix C — Source References for Content Authoring

When building the Excel impact/remedy text, align with widely cited Parashari/Vedic sources:

- Phaladeepika, Jataka Parijata — yoga definitions
- Mantreshwara’s Phaladeepika — Rahu/Ketu axis effects
- Contemporary consensus: B.V. Raman, Dr. K.N. Rao (cancellation debates)
- Temple tradition: Trimbakeshwar Kaal Sarpa puja (type-specific shanti)

All user-facing text should use balanced, non-alarmist language with the standard project disclaimer.

---

*Document version: 1.2 — Parashari Raja Yoga & Mahapurusha detection criteria added.*
