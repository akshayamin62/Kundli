# Chandal Dosha (Guru Chandal Yoga) — Feature Plan

> **Status:** Planning only — no implementation yet.  
> **Scope:** Detection, classification, impact text, mitigating factors, conventional + modern remedies, UI tab, and API — following Pitru Dosha / Kaal Sarpa patterns in this project.  
> **Document version:** 2.0 — revised with Parashari foundations, multi-source Vedic review, and balanced classical/modern interpretation.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Etymology, Terminology & Scriptural Background](#2-etymology-terminology--scriptural-background)
3. [Relationship to Existing Features](#3-relationship-to-existing-features)
4. [Astrological Foundation](#4-astrological-foundation)
5. [Formation Rules (Detection Logic)](#5-formation-rules-detection-logic)
6. [Yoga Presence (Binary)](#6-yoga-presence-binary)
7. [Variants & Classification](#7-variants--classification)
8. [Life Domains Affected (Karaka Themes)](#8-life-domains-affected-karaka-themes)
9. [Impact by Jupiter’s House (12 Types)](#9-impact-by-jupiters-house-12-types)
10. [Impact by Sign & Dignity](#10-impact-by-sign--dignity)
11. [Orb, Combustion & Fructification](#11-orb-combustion--fructification)
12. [Constructive Channels (Positive Potential)](#12-constructive-channels-positive-potential)
13. [Severity Grading](#13-severity-grading)
14. [Mitigating Factors](#14-mitigating-factors)
15. [Remedies](#15-remedies)
16. [Health Correlations (Ayurvedic Jyotish)](#16-health-correlations-ayurvedic-jyotish)
17. [Integration with This Project](#17-integration-with-this-project)
18. [Backend Architecture Plan](#18-backend-architecture-plan)
19. [API Design](#19-api-design)
20. [Frontend / UI Plan](#20-frontend--ui-plan)
21. [Data Model](#21-data-model)
22. [Design Decisions to Finalize](#22-design-decisions-to-finalize)
23. [Implementation Phases](#23-implementation-phases)
24. [Testing Strategy](#24-testing-strategy)
25. [Future Enhancements](#25-future-enhancements)

---

## 1. Overview

**Chandal Dosha** (also **Guru Chandal Yoga**, **Guru-Rahu Yoga**, **Guru-Ketu Yoga**) is a well-known combination in Vedic astrology formed when **Jupiter (Guru / Brihaspati)** shares the same sign with **Rahu** or **Ketu**. The Sanskrit *chandala* (often shortened to *chandal* in modern Hindi) historically meant “outside conventional social/dharmic structure”; in Jyotish it metaphorically describes **wisdom displaced from its natural anchoring** — the Guru principle operating alongside shadow-graha illusion, obsession, or abrupt detachment.

| Term | Meaning |
|------|---------|
| **Guru Chandal Yoga** | Jupiter + Rahu in same sign — **classical primary form** cited in popular BPHS-style verses |
| **Guru-Ketu Yoga** | Jupiter + Ketu in same sign — included in many North Indian traditions; sometimes named separately |
| **Shani Chandal Yoga** | Saturn + Rahu/Ketu — related dosha family; **not in v1 scope** |
| **Chandal Dosha** | Umbrella label in apps/consultations — **this feature = Jupiter + nodes in D1** |

### Core condition (project default)

```
Chandal present  ⟺  Jupiter shares the same sign (Whole Sign) as Rahu OR Ketu in D1
```

Rahu and Ketu are always **180° apart**, so **at most one node** can occupy Jupiter’s sign. A chart therefore has **zero or one** Guru Chandal finding — never Jupiter conjunct both nodes.

### Population & prevalence

By orbital mechanics alone, Jupiter (~12-year cycle) and Rahu/Ketu (~18-year cycle) share a sign in roughly **8–10%** of charts. Structural presence does **not** equal full manifestation; dignity, house, orb, dasha, and mitigations determine lived expression (see [Sections 11–14](#11-orb-combustion--fructification)).

### Why add this feature?

| Reason | Detail |
|--------|--------|
| User demand | Guru Chandal is routinely asked about with Kaal Sarpa and Pitru Dosha |
| Clear Parashari rule | Same-sign conjunction is objective from `ChartResponse` |
| Gap in app | Pitru’s “Afflicted Jupiter” is broader; no dedicated Jupiter+node yoga module |
| Reuse | Same detect → enrich → tab pipeline as Pitru / Kaal Sarpa |

### What this feature is NOT

- Not **Pitru Dosha** (Sun/nodal/9th-house ancestral matrix — independent diagnosis)
- Not **Kaal Sarpa** (seven grahas on one nodal semicircle)
- Not **Grahan Dosha** (Sun/Moon with nodes — eclipse yoga family)
- Not **Angarak** (Mars+Rahu) or **Shrapit** (Saturn+Rahu) — sibling Rahu-conjunction doshas
- Not automatic **dosha bhanga** that hides presence — mitigations adjust **severity only** (same as Kaal Sarpa in this project)
- Not a moral verdict on the native — classical “fallen guru” language is **symbolic**, not ethical judgment

### Honest framing (classical + modern)

Classical sources often describe difficulty: religious doubt, unethical shortcuts, false teachers, distorted learning. Modern Jyotish also documents **constructive** expression: cross-cultural scholarship, religious reform, innovative pedagogy, foreign education, spiritual bridge-building (e.g. Bal Gangadhar Tilak — Jupiter with nodes in **9th in Pisces**, reformist Ganesh Utsav traditions). The app should present **both poles** via `impact_types` and `positive_note`, not fear-only copy.

---

## 2. Etymology, Terminology & Scriptural Background

### 2.1 Sanskrit roots

| Word | Meaning in Jyotish context |
|------|---------------------------|
| **Guru** | Jupiter; also “teacher” — planet of wisdom, dharma, expansion |
| **Chandala / Chandal** | Historically a caste-outcast term; **in charts** = dharmic displacement, wisdom outside inherited structure |
| **Yoga** | Planetary combination producing defined results |
| **Dosha** | Affliction / challenging combination (popular label; some authors prefer “yoga” for all combos) |

**Historical note:** The caste-related meaning of *chandala* is problematic in modern discourse. In software copy, use **“Guru Chandal Yoga”** with explanation as **metaphorical affliction of the Guru graha**, not social status.

### 2.2 Classical verse (widely cited)

Many contemporary articles attribute this to *Brihat Parashara Hora Shastra* (BPHS):

> **गुरौ राहु समायाते चाण्डाल योगः प्रजायते।**  
> **बुद्धिहीनो भवेत् प्राज्ञो धर्महीनो दुरात्मवान्॥**

*Approximate sense:* When Rahu joins Jupiter, Chandal Yoga arises; themes of impaired wisdom, weakened dharma, and troubled character are described in the **classical difficulty framing**.

**Scholarly caution:** Exact chapter/verse attribution varies across editions; treat as **traditional summary verse** used in Guru Chandal literature, not as a uniquely machine-verifiable BPHS citation without manuscript check. The **structural rule** (Guru + Rahu) is nonetheless standard across Parashari commentaries.

### 2.3 Scriptural & textual references

| Source | Relevance to Guru Chandal |
|--------|---------------------------|
| **Brihat Parashara Hora Shastra** | Jupiter significations; nodal behavior; yogas by conjunction; nodes as co-lords of signs they occupy; Rahu/Ketu give effects by conjunction with lords and house placement |
| **Phaladeepika** (Mantreshwara) | Conjunction modifies natural karakatva; benefic afflicted by nodes |
| **Saravali** (Kalyana Varma) | Malefic influence on Jupiter affects houses Jupiter rules/aspects |
| **Rigveda 5.5.1** | Invoking Brihaspati’s power against deception — used in remedy traditions |
| **Garuda Purana** | Shadow planets corrupting spiritual significators (popular remedy literature) |
| **Mahabharata, Shanti Parva** | Loss of dharma when Guru principle is dishonoured — ethical framing |
| **B.V. Raman** & modern authors | Practical delineation; dignity and house modify results |

### 2.4 Related dosha family (Rahu conjunctions)

| Dosha | Combination | Primary themes |
|-------|-------------|----------------|
| **Guru Chandal** | Jupiter + Rahu/Ketu | Wisdom, dharma, teachers, children |
| **Angarak** | Mars + Rahu | Anger, violence, impulsive risk |
| **Shrapit / Shani Chandal** | Saturn + Rahu/Ketu | Karma, delay, ancestral burden |
| **Grahan** | Sun/Moon + nodes | Ego/vitality or mind eclipsed |

When Jupiter is conjunct Rahu, the chart may **lose Jupiter’s usual power to cancel other doshas** — Guru Chandal is weighted heavily in full-chart reading for this reason.

---

## 3. Relationship to Existing Features

### vs Pitru Dosha

| Aspect | Pitru Dosha | Chandal Dosha |
|--------|-------------|---------------|
| Primary graha | Sun, Moon, nodes, Saturn, etc. | **Jupiter + node** |
| Jupiter rule | `Afflicted Jupiter` in Sag/Aqu/Pis when afflicted by node **or Saturn** or debilitated | **Strict same-sign conjunction** with Rahu or Ketu |
| Themes | Ancestral karma, pitru, lineage | Dharma, guru, wisdom, ethics, learning |
| Overlap | Both may appear in one chart | **Independent cards**; do not merge logic |

Pitru Excel’s “Guru Chandal Yoga Pitru Link” on **Mercury+node** combos is a **separate pitru combination label** — not a substitute for this module.

### vs Kaal Sarpa

| Aspect | Kaal Sarpa | Chandal |
|--------|------------|---------|
| Geometry | Global semicircle (7 grahas) | Local Jupiter–node conjunction |
| Types | 12 by **Rahu house** | 12 by **Jupiter house** |
| Presence | Binary | Binary (0 or 1 per chart) |

### Code reuse

| Asset | Reuse |
|-------|--------|
| `_same_sign()` from `pitru_dosha.py` | Conjunction detection |
| `_planets()` node mapping | Rahu/Ketu naming |
| `yoga_detection.py` | Dignity, Mahapurusha, Raja Yoga mitigations |
| `KaalSarpaPanel` layout | Single-finding UI |
| `impact_area`, `impact_types`, `conventional_remedies`, `modern_remedies` | Field naming |

---

## 4. Astrological Foundation

### 4.1 Jupiter (Guru / Brihaspati) — karakatva

| Domain | Significations |
|--------|----------------|
| Wisdom | Higher learning, philosophy, discernment, *prajna* |
| Dharma | Ethics, religion, law, righteous conduct |
| Teachers | Guru, priests, mentors, advisors |
| Prosperity | Fortune, grace, expansion (not raw Mars-style acquisition) |
| Progeny | Children, continuity of lineage |
| Body | Liver, fat tissue, metabolism, thighs (medical Jyotish) |
| Natural houses | 9th (Sagittarius), 12th (Pisces) |
| Dignity | **Exaltation:** Cancer (deep ~5°) · **Own:** Sagittarius (mooltrikona 0°–10°), Pisces · **Debilitation:** Capricorn |

### 4.2 Rahu — karakatva

| Domain | Significations |
|--------|----------------|
| Material hunger | Ambition, obsession, foreign desires |
| Illusion | Maya, smoke, misdirection |
| Unconventional | Breaking norms, taboo, innovation |
| Amplification | Intensifies conjunct graha — “gives results of the sign/house it occupies” (BPHS principle) |
| Shadow | Ethical boundary blur when unguided |

### 4.3 Ketu — karakatva

| Domain | Significations |
|--------|----------------|
| Detachment | Moksha, renunciation, cutting ties |
| Past karma | *Purva punya*, inherited spiritual impressions |
| Confusion | Scattered faith, rejection of form without inner substance |
| Insight | Genuine mysticism when Jupiter is strong |
| Opposite of Rahu | Inward release vs outward grasping |

### 4.4 Jupiter–Rahu chemistry

```
Jupiter  →  integrate, preserve, transmit inherited wisdom (sattvic expansion)
Rahu     →  disrupt categories, amplify appetite, foreign/unorthodox paths
────────────────────────────────────────────────────────────────────────────
Together →  tension between dharma and desire; wisdom tested by illusion;
            unconventional knowledge; guru themes outside traditional mold
```

### 4.5 Jupiter–Ketu chemistry

Less commonly named in classical lists than Guru+Rahu, but widely used in practice:

```
Jupiter  →  teaching, faith, children, law
Ketu     →  detachment, moksha, past-life residue
────────────────────────────────────────────────────────────────────────────
Together →  spiritual withdrawal; difficulty sustaining one path/teacher;
            genuine insight mixed with confusion; “knows but cannot apply”
```

### 4.6 Chart settings (project)

| Setting | Value |
|---------|--------|
| Zodiac | Sidereal (Lahiri) |
| Houses | Whole Sign — **Jupiter’s house** = type classifier |
| Chart | **D1 primary**; D-9 note informational only |

| Graha | Backend name |
|-------|--------------|
| Jupiter | `Jupiter` |
| Rahu | `North Node` |
| Ketu | `South Node` |

---

## 5. Formation Rules (Detection Logic)

### 5.1 Schools of formation (document all; implement one)

| School | Rule | v1 in this project |
|--------|------|-------------------|
| **A. Parashari conjunction (standard)** | Jupiter and Rahu **or** Ketu in **same sign** | **YES — primary** |
| **B. Same house (Whole Sign)** | Equivalent to A under Whole Sign houses | **YES** |
| **C. Degree orb** | Tighter conjunction = stronger; wide same-sign = weaker | **Severity metadata only** |
| **D. Mutual 5th/9th aspect** | Jupiter and Rahu in mutual trine signs (some authors, e.g. Phaladeepika-style drishti traditions) | **NO — document in FAQ** |
| **E. Opposition aspect** | Rahu aspects Jupiter from 7th sign (minority tradition) | **NO** |
| **F. Rahu in Jupiter-ruled sign + weak Jupiter** | Extended affliction, not strict Chandal | **NO — Pitru-adjacent** |

**Contested claim (exclude from detection):** Some blogs state Jupiter in one house with Rahu aspecting from 5th/9th forms “helpful” Guru Chandal — this is **not** the conjunction yoga and is **out of scope** for binary presence.

### 5.2 Primary algorithm (v1)

```
INPUT:  chart.planets[], houses (Whole Sign)
        Map North Node → Rahu, South Node → Ketu

STEP 1: Load Jupiter, Rahu, Ketu

STEP 2: Conjunction
        with_rahu = (Jupiter.sign == Rahu.sign)
        with_ketu = (Jupiter.sign == Ketu.sign)
        # Mutually exclusive

STEP 3: Presence (binary)
        IF with_rahu  → present=true, variant=guru_rahu, node=Rahu
        ELIF with_ketu → present=true, variant=guru_ketu, node=Ketu
        ELSE → present=false

STEP 4: Classify
        type_house = Jupiter.house (1–12)
        sign = Jupiter.sign
        dignity = exalted | own | debilitated | neutral
        combust = Jupiter within combustion orb of Sun
        orb_deg = |Jupiter.longitude − node.longitude| (same sign)

STEP 5: base_severity from house + dignity + dusthana/trikona
STEP 6: mitigating_factors → effective_severity
STEP 7: Enrich from chandal_dosha_data.py
```

### 5.3 Edge cases

| Case | Rule |
|------|------|
| Same sign, far apart in degrees | **Present**; `conjunction_strength` = weak/moderate/close from orb |
| Jupiter combust | **Present**; increases severity; Jupiter’s voice “silenced” classically |
| Jupiter retrograde | **Present**; note only — retrograde Jupiter revisits guru themes |
| Node retrograde | Nodes are always retrograde in ephemeris — ignore for presence |
| Jupiter in Capricorn + node | **Present** — classic severe combo (debilitated Guru) |
| Jupiter in Cancer + node | **Present** — strong Guru; mitigations likely |

---

## 6. Yoga Presence (Binary)

Same principle as Kaal Sarpa in this project:

| `present` | Meaning |
|-----------|---------|
| `true` | Jupiter shares sign with Rahu or Ketu in D1 |
| `false` | No such conjunction |

**No partial / Anshik / “mild Chandal” as separate presence flag.** Orb and mitigations affect **severity** and copy, not whether the yoga is listed.

Optional display fields when `present=true`:

| Field | Purpose |
|-------|---------|
| `conjunction_orb_degrees` | 0°–30° within sign |
| `conjunction_strength` | `close` (≤8°), `moderate` (9°–15°), `wide` (16°–30°) |
| `jupiter_combust` | bool |
| `jupiter_dignity` | exalted / own / debilitated / neutral |

---

## 7. Variants & Classification

### 7.1 Primary variants

| ID | Condition | Traditional label |
|----|-----------|-------------------|
| `guru_rahu` | Jupiter + Rahu same sign | Guru Chandal / Guru-Rahu Yoga (**classical default**) |
| `guru_ketu` | Jupiter + Ketu same sign | Guru-Ketu / Chandala-Ketu (regional names vary) |

### 7.2 Variant flavour (interpretive)

| Variant | Challenging expression | Constructive expression |
|---------|------------------------|-------------------------|
| **guru_rahu** | Materialism in guru’s name; fake spirituality; foreign shortcuts; inflated ego; **spiritual materialism** | Foreign education; global business; cross-cultural philosophy; charismatic teaching |
| **guru_ketu** | Faith swings; rejecting all gurus; moksha confusion; neglect of practical dharma | Deep meditation; research in mysticism; past-life spiritual credit; minimalist ethics |

### 7.3 Type dimension: Jupiter’s house (1–12)

House of **Jupiter** (node is co-present in that house under Whole Sign) drives life-area expression.

| House | Sanskrit theme | Type name (EN) |
|-------|----------------|----------------|
| 1 | Tanu | Lagna Guru Chandal |
| 2 | Dhana | Dhana Guru Chandal |
| 3 | Sahaj | Sahaj Guru Chandal |
| 4 | Sukha | Sukha Guru Chandal |
| 5 | Putra | Putra Guru Chandal |
| 6 | Ripu | Ripu Guru Chandal |
| 7 | Kalatra | Kalatra Guru Chandal |
| 8 | Randhra | Randhra Guru Chandal |
| 9 | Bhagya | Bhagya Guru Chandal |
| 10 | Karma | Karma Guru Chandal |
| 11 | Labha | Labha Guru Chandal |
| 12 | Vyaya | Vyaya Guru Chandal |

### 7.4 House quality (severity context)

| Category | Houses | Classical tendency |
|----------|--------|-------------------|
| **Trikona** | 1, 5, 9 | Dharmic houses — difficult themes often channel into **learning, creativity, reform**; 9th hits guru/father directly |
| **Kendra** | 1, 4, 7, 10 | Manifest in visible life arenas (self, home, marriage, career) |
| **Dusthana** | 6, 8, 12 | **Strongest destructive potential** — disease, scandal, loss, isolation |
| **Upachaya** | 3, 6, 10, 11 | May improve with age; 6th still litigious |

### 7.5 Shani Chandal (v2)

Saturn + Rahu/Ketu — defer to separate feature.

---

## 8. Life Domains Affected (Karaka Themes)

When Guru Chandal is active (especially in Jupiter or Rahu dasha), classical authors emphasize:

### Wisdom & judgment

- Knows what is right intellectually but feels pulled otherwise  
- Clever rationalization; shortcuts over patient dharma  
- **Positive:** innovative thinking; questions stale dogma productively  

### Teachers & authority

- Charismatic but questionable mentors (Rahu)  
- Cycling through philosophies; disillusionment with institutions  
- **Risk:** predatory guru vulnerability — verify track record, finances, boundaries  
- **Positive:** self-taught mastery; bridge teachers for modern audiences  

### Education

- Unconventional degrees; breaks in formal education; foreign study  
- Brilliance with scattered focus (5th house emphasis)  
- **Positive:** interdisciplinary scholarship  

### Dharma & spirituality

- Religious doubt; departure from inherited tradition  
- **Positive:** personal constructed ethics; syncretic spirituality  
- Jupiter-Rahu: spiritual materialism — siddhi/power chasing  
- Jupiter-Ketu: formless seeking without grounding  

### Children & progeny (5th / Jupiter karaka)

- Delays, unconventional paths for children; worry about values transmitted  
- *Karko bhavo nashaya* risk when Jupiter as putra karaka is afflicted in 5th  

### Wealth & ethics

- Gains through foreign/unorthodox channels  
- Ethical grey zones in finance — Jupiter’s law vs Rahu’s hunger  

### Father / pitru figures (9th)

- Distance, disagreement, or unconventional father/guru relationship  
- Not identical to Pitru Dosha but themes may **overlap in lived experience**  

---

## 9. Impact by Jupiter’s House (12 Types)

Reference for `chandal_dosha_data.py`. Each row should include `impact_area`, `impact_types`, `positive_note`, `severity_baseline`, remedies.

**Legend:**  
- **Challenge** = classical difficult expression  
- **Channel** = constructive potential when Jupiter is strong / mitigated  

### 9.1 House 1 — Lagna (Tanu)

| Field | Content |
|-------|---------|
| **impact_area** | Self, body, vitality, personal dharma, overall life direction |
| **impact_types (challenge)** | Identity confusion; ego inflation masking insecurity; moral compass feels unstable; may reject good counsel; health sensitivity (liver, weight, hormones) |
| **positive_note (channel)** | Personality that bridges tradition and innovation; self-made philosopher; strong public presence when dignity is good |
| **severity_baseline** | High |

### 9.2 House 2 — Dhana

| Field | Content |
|-------|---------|
| **impact_area** | Wealth, speech, family values, food habits, truthfulness in communication |
| **impact_types (challenge)** | Harsh or persuasive speech that misleads; family disputes over religion/money; unstable dharmic values around finance; sweet talk with hidden motive (Rahu) |
| **positive_note (channel)** | Eloquent teacher; wealth via foreign/education channels; reform of family customs (e.g. public figures with 2nd-house Guru Chandal) |
| **severity_baseline** | Moderate–High |

### 9.3 House 3 — Sahaj

| Field | Content |
|-------|---------|
| **impact_area** | Siblings, courage, communication, skills, short journeys |
| **impact_types (challenge)** | Miscommunication with siblings/neighbours; bold plans without wisdom; writings or media with controversial views; hidden motives in peer networks |
| **positive_note (channel)** | Powerful orator; investigative journalist; courage to speak against injustice |
| **severity_baseline** | Moderate |

### 9.4 House 4 — Sukha

| Field | Content |
|-------|---------|
| **impact_area** | Home, mother, property, vehicles, inner peace, foundational beliefs |
| **impact_types (challenge)** | Domestic unrest; mother relationship karmically complex; desire for grand home without peace; property disputes or deception in real estate |
| **positive_note (channel)** | Home as ashram/learning centre; multicultural household; emotional depth from spiritual seeking |
| **severity_baseline** | High |

### 9.5 House 5 — Putra

| Field | Content |
|-------|---------|
| **impact_area** | Children, education, creativity, romance, speculation, mantras |
| **impact_types (challenge)** | Progeny worries or unconventional children’s paths; romance idealism; speculative losses; arrogance in studies; *karko bhavo nashaya* themes |
| **positive_note (channel)** | Brilliant unconventional intelligence (e.g. medical/scientific insight); creative genius; innovative pedagogy — **5th is trikona** |
| **severity_baseline** | Moderate–High (thematically strong for education/children) |

### 9.6 House 6 — Ripu (Dusthana)

| Field | Content |
|-------|---------|
| **impact_area** | Enemies, debts, litigation, service, chronic illness |
| **impact_types (challenge)** | Workplace politics; legal battles; unethical competition; service in morally grey institutions; hard-to-diagnose illness |
| **positive_note (channel)** | Victory over powerful opponents when Jupiter strong (classical example: political struggle charts); healers in alternative medicine |
| **severity_baseline** | Very High |

### 9.7 House 7 — Kalatra

| Field | Content |
|-------|---------|
| **impact_area** | Marriage, spouse, business partnerships, contracts, public dealings |
| **impact_types (challenge)** | Marital discord; spouse unconventional or foreign; trust issues in contracts; guru-type partner who confuses dharma |
| **positive_note (channel)** | Cross-cultural marriage; partnership in education/law/spiritual business with global reach |
| **severity_baseline** | High |

### 9.8 House 8 — Randhra (Dusthana)

| Field | Content |
|-------|---------|
| **impact_area** | Longevity, sudden events, inheritance, occult, shared resources |
| **impact_types (challenge)** | Sudden reversals; inheritance disputes; obsession with tantra/occult without guru; secrecy around ethics; anxiety about mortality |
| **positive_note (channel)** | Deep researcher in astrology/ayurveda/psychology; transformative wisdom through crisis |
| **severity_baseline** | Very High |

### 9.9 House 9 — Bhagya (Trikona)

| Field | Content |
|-------|---------|
| **impact_area** | Father, guru, dharma, fortune, higher education, long pilgrimage |
| **impact_types (challenge)** | **Core Guru Chandal house** — guru disputes; father distance; false teachers; ideological rebellion; breaks in higher degree |
| **positive_note (channel)** | Religious reformer; philosopher; dharmic lawyer; international professor — **Jupiter’s natural domain**; strong when Jupiter in own/exalt sign (e.g. Pisces 9th) |
| **severity_baseline** | Very High (thematic intensity) |

### 9.10 House 10 — Karma

| Field | Content |
|-------|---------|
| **impact_area** | Career, authority, government, public reputation, karma in world |
| **impact_types (challenge)** | Career scandals; ethical slips visible publicly; authority conflicts; reputation damaged by guru/religion themes |
| **positive_note (channel)** | Unconventional career success; judge, professor, NGO leader; foreign-linked profession |
| **severity_baseline** | High |

### 9.11 House 11 — Labha

| Field | Content |
|-------|---------|
| **impact_area** | Gains, networks, elder siblings, aspirations, social circles |
| **impact_types (challenge)** | Gains through questionable networks; unreliable friends; hopes inflated by Rahu then disappointed |
| **positive_note (channel)** | Large following as teacher; gains from foreign alliances; social reform movements |
| **severity_baseline** | Moderate |

### 9.12 House 12 — Vyaya (Dusthana)

| Field | Content |
|-------|---------|
| **impact_area** | Expenses, foreign lands, isolation, sleep, moksha, hospitals |
| **impact_types (challenge)** | Hidden expenses; foreign settlement confusion; spiritual escapism; hospitalisation expenses; secret guru cults |
| **positive_note (channel)** | Genuine monastic inclination; foreign spiritual study; charity law; liberation-oriented path when Jupiter strong |
| **severity_baseline** | Very High |

---

## 10. Impact by Sign & Dignity

Sign modulates **how** Jupiter fights or surrenders to the node. Use as Phase 2 overlay on house type.

| Sign | Jupiter dignity | Theme |
|------|-----------------|-------|
| **Cancer** | Exalted | Strongest Jupiter — Chandal **present** but often **highly mitigated**; compassionate guru themes |
| **Sagittarius** | Own / Mooltrikona | Dharmic fire tested; reformist preacher potential |
| **Pisces** | Own | Mystical wisdom; confusion or deep devotion |
| **Capricorn** | Debilitated | **Severe** — wisdom crushed by worldly structure + node; ethics vs ambition crisis |
| **Aries** | Neutral | Impulsive dharma; hot judgment |
| **Taurus** | Neutral | Fixed beliefs about wealth; stubborn guru opinions |
| **Gemini** | Neutral | Many teachers, scattered scriptures |
| **Leo** | Neutral | Ego in religion; pride in knowledge |
| **Virgo** | Neutral | Critical spirituality; over-analysis of gurus |
| **Libra** | Neutral | Partnership distortions; unfair counsel in contracts |
| **Scorpio** | Neutral | Secret occult gurus; intense ideological secrecy |
| **Aquarius** | Neutral | Rebel philosopher; tech-age guru themes |

### Dignity × variant quick matrix

| Jupiter state | guru_rahu tendency | guru_ketu tendency |
|---------------|-------------------|-------------------|
| Exalted / Own | Unorthodox but **ethical teacher** | Mystic with real depth |
| Neutral | Mixed — depends on house | Scattered faith |
| Debilitated | Manipulation, hypocrisy risk | Cynicism, nihilism risk |
| Combust | Guru voice weak publicly | Inner knowing vs outer display gap |

---

## 11. Orb, Combustion & Fructification

### 11.1 Conjunction orb (strength, not presence)

| Separation (same sign) | `conjunction_strength` | Traditional weight |
|------------------------|--------------------------|-------------------|
| 0° – 8° | `close` | Strongest — “true Guru Chandal” |
| 9° – 15° | `moderate` | Clear but softer |
| 16° – 30° | `wide` | Many authors treat as **minimal activation** |

### 11.2 Combustion

Jupiter within **~8°** of Sun (standard combustion orb — match project ephemeris rule):

- Yoga **still forms**  
- Jupiter’s benefic voice weakened — **advice not heard**, gurus overlooked, judgment clouded  
- Increases severity tier  

### 11.3 Dasha activation (fructification)

Effects most visible when:

| Period | Activation |
|--------|------------|
| **Jupiter Mahadasha** (16 years) | Guru themes, children, law, fortune |
| **Rahu Mahadasha** (18 years) | Illusion, foreign, obsession on Jupiter’s domains |
| **Ketu Mahadasha** (7 years) | Detachment, moksha, confusion |
| **Jupiter–Rahu / Rahu–Jupiter Antardasha** | Peak Guru Chandal period |
| **Node transit over natal Jupiter** | Trigger within active dasha |
| **Jupiter return** (~12 years) | Recurring dharmic review |

**UI (Phase 2):** show informational note if current dasha lords include Jupiter or active node.

### 11.4 Transits (informational)

- Eclipse on Jupiter–node conjunction  
- Saturn aspect on conjunction (classical **mitigation** when Saturn dignified)  
- Jupiter transit over natal conjunction  

---

## 12. Constructive Channels (Positive Potential)

Present in `positive_note` and variant copy — avoids fear-only UX.

| Channel | Description |
|---------|-------------|
| **Innovative educator** | Unconventional pedagogy; reaches students mainstream schools miss |
| **Cross-cultural scholar** | Philosophy, comparative religion, translation |
| **Religious reformer** | Modernises ritual while retaining core dharma (Tilak-type) |
| **Spiritual bridge figure** | Teaches tradition to secular/modern audiences |
| **Foreign education & law** | International degrees, immigration law, global ethics |
| **Entrepreneur with vision** | Questions stale industry norms — ethical risk if unmitigated |
| **Author / philosopher** | Writes on dharma, ethics, spirituality outside establishment |
| **Healer** | Ayurveda, counselling, chaplaincy — guru energy in service |

**Principle:** Same structural yoga; expression depends on dignity, house, mitigations, dasha, and conscious choices.

---

## 13. Severity Grading

### 13.1 Base severity (from house)

| Baseline | Houses |
|----------|--------|
| **Very High** | 6, 8, 9, 12 |
| **High** | 1, 4, 7, 10 |
| **Moderate–High** | 2, 5 |
| **Moderate** | 3, 11 |

House 9 is **Very High** thematically (guru/father) even though trikona — trikona reduces **destructive** tone in `positive_note`, not thematic salience.

### 13.2 Severity increases (+1 tier)

| Factor | Notes |
|--------|-------|
| Jupiter **debilitated** (Capricorn) | Classic severe |
| Jupiter **combust** | Voice of guru weakened |
| **`conjunction_strength` = close** | ≤8° |
| **Dusthana** placement | 6, 8, 12 |
| **Malefic aspect** on Jupiter (Mars, Saturn unmitigated) | Per `yoga_detection` affliction helpers |

### 13.3 Severity decreases (mitigations — Section 14)

| Factor | Notes |
|--------|-------|
| Jupiter **exalted / own** | Strongest classical softening |
| **Wide orb** (16°+) | Traditional “weak yoga” |
| Strong **9th lord** / benefics in 9th | Dharmic scaffolding |
| **Trikona** + dignified Jupiter | Constructive channel likely |
| Hamsa Mahapurusha, Raja Yoga mitigations | From shared `yoga_detection` |

### 13.4 Output labels

`Very High` → `High` → `Moderate` → `Low` → `Mitigated`

Store `base_severity` and `effective_severity` (Kaal Sarpa pattern).

---

## 14. Mitigating Factors

**Project rule:** Mitigations adjust **`effective_severity` only** — never set `present: false`. Classical “cancellation” rules are mapped here as mitigations.

| # | Factor | Parashari / traditional basis | Weight |
|---|--------|------------------------------|--------|
| **M1** | **Strong Jupiter** | Own (Sagittarius, Pisces) or exaltation (Cancer); not combust | Very High |
| **M2** | **Jupiter in Kendra/Trikona** | 1,4,7,10 or 1,5,9 — constructive manifestation | High |
| **M3** | **Strong 9th lord / 9th house** | 9th lord in kendra/trikona, own/exalt; Venus/Mercury/Moon well placed in 9th | Very High |
| **M4** | **Wide conjunction orb** | >15° same sign — many texts minimise dosha | High |
| **M5** | **Saturn aspect on Jupiter** | Saturn disciplines Rahu; stronger if Saturn dignified | Moderate |
| **M6** | **Benefic aspect on Jupiter** | Moon, Venus, Mercury (unafflicted) — Parashari aspects | Moderate |
| **M7** | **Hamsa Mahapurusha** | Jupiter in kendra in own/exalt (`yoga_detection`) | High |
| **M8** | **Raja Yoga present** | Kendra–trikona lord links (`yoga_detection`) | Moderate |
| **M9** | **Unafflicted Moon** | Stable mind for dharmic choices | Moderate |
| **M10** | **D-9 repetition note** | Informational: Guru+node in Navamsa or not | Low (info only) |

### Explicitly excluded as presence cancellation

| Rule | Reason |
|------|--------|
| “Exalted Rahu nullifies Chandal” | Disputed; not universal |
| “D-9 clear ⇒ no dosha” | Used as info only (M10) |
| Aspect-only Guru Chandal | Not conjunction — separate tradition |
| Bhanga flips `present` to false | Against project binary policy |

---

## 15. Remedies

Two fields per data row (Kaal Sarpa / Pitru convention):

| Field | Content |
|-------|---------|
| `conventional_remedies` | Mantra, puja, fasting, seva, deity worship |
| `modern_remedies` | Ethics, mentorship vetting, education, health, therapy |

### 15.1 Universal conventional

**Jupiter (strengthen Guru — presiding deity Vishnu / Brihaspati):**

| Practice | Detail |
|----------|--------|
| **Guru Beej Mantra** | `Om Graam Greem Graum Sah Gurave Namah` — 108× daily; especially **Thursdays** |
| **Simple Guru mantra** | `Om Gurve Namah` or `Om Brihaspataye Namah` |
| **Vishnu Sahasranama** | Thursday recitation — classical Jupiter remedy |
| **Thursday (Guruvar)** | Yellow clothes; sattvic food; ghee, chana dal, turmeric, banana |
| **Donation** | Yellow items, books, support to **verified** teachers/students |
| **Fasting** | Partial Thursday fast if health permits |
| **Guru seva** | Serve authentic acharyas, professors, ethical mentors |
| **Sat-sang** | Association with wise, grounded people |

**Rahu (balance shadow — not “destroy” Rahu):**

| Practice | Detail |
|----------|--------|
| **Rahu Beej Mantra** | `Om Bhraam Bhreem Bhraum Sah Rahave Namah` — 108× |
| **Simple Rahu mantra** | `Om Rahave Namah` |
| **Charity** | Blind or needy; avoid adharma even when Rahu pushes shortcuts |
| **Rahu shanti** | Temple traditions where appropriate |

**Ketu (if `guru_ketu`):**

| Practice | Detail |
|----------|--------|
| **Ketu Beej Mantra** | `Om Straam Streem Straum Sah Ketave Namah` |
| **Ganesha worship** | Ketu connected to Ganesha in some traditions |
| **Grounding** | Structured daily practice vs formless drifting |

**Ritual (optional, with discernment):**

- Guru Chandal Nivaran Puja / Havan — Thursday, Guru Pushya nakshatra if advised by competent priest  
- **Rudraksha:** 5 Mukhi (Jupiter), 8 Mukhi (Rahu), 9 Mukhi (Ketu) — only after chart-specific advice  

**Scriptural anchor:** Rigveda 5.5.1 — invoking Brihaspati against deception.

### 15.2 Universal modern

- **Verify gurus** — credentials, conduct, financial transparency, boundary respect  
- **Ethical commitments** — written personal dharma code; peer accountability  
- **Education** — complete formal training where possible; resist purely “shortcut” courses  
- **Fact-check** spiritual claims; beware spiritual materialism and cult dynamics  
- **Therapy / spiritual direction** when religious doubt causes distress  
- **Liver & metabolic care** — screening if indicated (see Section 16)  
- **Nishkama karma** — Gita-style service reduces Jupiter-Rahu ego-spirituality  

### 15.3 House-emphasis remedies

| House | Extra focus |
|-------|-------------|
| **5** | Children’s education trust; avoid speculative gambling |
| **7** | Pre-marital counselling; clear partnership contracts |
| **9** | Father/guru reconciliation; pilgrimage with discernment; study authentic shastras |
| **10** | Professional ethics training; transparency in public role |
| **12** | Budget discipline; structured meditation retreat vs escapism |

### 15.4 What classical texts do NOT require

- Expensive “dosha removal” packages without chart-specific basis  
- Yellow sapphire (Pukhraj) for **every** Guru Chandal chart — Jupiter gem can be tricky if Jupiter is already strong or is a functional malefic  
- Fear-based repeated pujas without lifestyle/dharma change  

---

## 16. Health Correlations (Ayurvedic Jyotish)

**Disclaimer:** Tendencies only — not medical diagnosis.

| Jupiter–body link | Possible themes when afflicted |
|-------------------|-------------------------------|
| Liver, gallbladder | Fatty liver, enzyme abnormalities |
| Fat tissue, metabolism | Obesity, diabetes risk (with other chart/medical factors) |
| Pancreas / spleen (secondary traditions) | Blood sugar regulation |

Align with Pitru “Afflicted Jupiter” modern remedy themes: HbA1c, liver profile, weight management, disciplined diet.

Activate most when: Jupiter dasha + close conjunction + debilitated/combust Jupiter.

---

## 17. Integration with This Project

### New files (implementation)

| File | Purpose |
|------|---------|
| `docs/CHANDAL_DOSHA.md` | This document |
| `backend/app/services/chandal_dosha.py` | Detection, orb, mitigations |
| `backend/app/data/chandal_dosha_data.py` | 12 house rows + 2 variant overlays |
| `backend/scripts/build_chandal_dosha_data.py` | Optional Excel → Python |
| `frontend/src/components/ChandalDoshaPanel.tsx` | Result tab |
| Schemas + route | `ChandalDoshaResponse`, `POST /api/chart/chandal-dosha` |

### Flow

```
POST /api/chart/calculate  →  ChartResponse
        ↓
POST /api/chart/chandal-dosha
        ↓
Detect → classify → severity → enrich → ChandalDoshaPanel
```

### Result tab

```typescript
type MainTab = "kundali" | "grahsil" | "allvargas" | "pitru" | "kaalsarpa" | "chandal";
```

| Lang | Label |
|------|-------|
| en | Chandal Dosha |
| hi | गुरु चांडाल योग |
| gu | ગુરુ ચાંડાલ યોગ |

Subtitle: “Guru Chandal Yoga” in all languages for clarity.

---

## 18. Backend Architecture Plan

### Service: `chandal_dosha.py`

```
calculate_chandal_dosha(chart: dict) -> dict

_detect_guru_chandal(by) -> Finding | None
_jupiter_dignity(jupiter) -> str
_is_combust(jupiter, sun) -> bool
_conjunction_orb(jupiter, node) -> float
_conjunction_strength(orb) -> close | moderate | wide
_house_row(house) -> HouseRow
_variant_overlay(variant) -> VariantOverlay
_evaluate_mitigations(chart, jupiter, orb) -> list[Mitigation]
_effective_severity(base, mitigations) -> str
_navamsa_note(chart) -> str   # M10 informational
```

### Data: `chandal_dosha_data.py`

```python
HouseRow = {
    "house": 9,
    "type_name_en": "Bhagya Guru Chandal",
    "type_name_hi": "भाग्य गुरु चांडाल",
    "type_name_gu": "ભાગ્ય ગુરુ ચાંડાલ",
    "sanskrit_theme": "Bhagya / Dharma",
    "house_category": "trikona",  # trikona | kendra | dusthana | upachaya
    "impact_area": "...",
    "impact_types": "...",        # challenge text
    "positive_note": "...",       # constructive channel
    "severity_baseline": "Very High",
    "conventional_remedies": "...",
    "modern_remedies": "...",
}

VariantOverlay = {
    "variant": "guru_rahu",
    "variant_label_en": "Guru Chandal (Jupiter + Rahu)",
    "variant_impact": "...",
    "variant_positive": "...",
}
```

---

## 19. API Design

### Endpoint

```
POST /api/chart/chandal-dosha
Authorization: Bearer <JWT>
Body: full ChartResponse JSON
```

### Response (present)

```json
{
  "present": true,
  "variant": "guru_rahu",
  "variant_label": "Guru Chandal (Jupiter + Rahu)",
  "jupiter": {
    "sign": "Pisces",
    "house": 9,
    "longitude": 12.4,
    "dignity": "own",
    "combust": false,
    "retrograde": false
  },
  "node": {
    "name": "Rahu",
    "sign": "Pisces",
    "house": 9,
    "longitude": 18.2
  },
  "conjunction_orb_degrees": 5.8,
  "conjunction_strength": "close",
  "type": {
    "house": 9,
    "name": "Bhagya Guru Chandal",
    "house_category": "trikona",
    "sanskrit_theme": "Bhagya / Dharma"
  },
  "base_severity": "Very High",
  "effective_severity": "Moderate",
  "impact_area": "Father, guru, dharma, fortune",
  "impact_types": "...",
  "positive_note": "...",
  "variant_impact": "...",
  "conventional_remedies": "...",
  "modern_remedies": "...",
  "mitigating_factors": [],
  "disclaimer": "Vedic combination analysis for educational purposes. Not a substitute for medical, legal, or spiritual counselling."
}
```

---

## 20. Frontend / UI Plan

Single-card layout (like Kaal Sarpa):

| Section | Content |
|---------|---------|
| Header | Present / Absent badge |
| Hero | Variant, Jupiter & node sign/house, dignity, orb strength |
| Severity | base → effective |
| Impact | `impact_area` + `impact_types` |
| Positive | `positive_note` (emerald card) |
| Variant | Rahu vs Ketu paragraph |
| Remedies | Conventional + Modern columns |
| Mitigations | Grid with matched/unmatched |
| Disclaimer | Footer |

**Absent state:** Green card — “Guru Chandal Yoga not formed in D1 (Jupiter not conjunct Rahu or Ketu by sign).”

---

## 21. Data Model

### Key fields

| Field | Type | Description |
|-------|------|-------------|
| `present` | bool | Binary presence |
| `variant` | enum | `guru_rahu` \| `guru_ketu` |
| `conjunction_orb_degrees` | float | 0–30 |
| `conjunction_strength` | enum | close \| moderate \| wide |
| `jupiter` | object | sign, house, dignity, combust |
| `node` | object | Rahu or Ketu |
| `type` | object | house type + category |
| `base_severity` | string | Before mitigation |
| `effective_severity` | string | After mitigation |
| `positive_note` | string | Constructive channel |
| `mitigating_factors` | array | M1–M10 |

---

## 22. Design Decisions to Finalize

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Detection | Same sign (Whole Sign) — Parashari standard |
| D2 | UI title | “Chandal Dosha” + subtitle “Guru Chandal Yoga” |
| D3 | Ketu inclusion | **Yes** — `guru_ketu` variant |
| D4 | Orb in API | **Yes** — strength metadata, not presence |
| D5 | D-9 | Informational (M10) only |
| D6 | Aspect-based Chandal | **No** in v1 |
| D7 | Pitru overlap | Show both independently |
| D8 | Shani Chandal | v2 separate feature |
| D9 | Copy tone | Balanced challenge + constructive |

---

## 23. Implementation Phases

### Phase 1 — MVP
- [ ] `chandal_dosha.py` + `chandal_dosha_data.py` (12 houses + 2 variants)
- [ ] API + schema + `ChandalDoshaPanel` + tab
- [ ] Binary presence + house type + remedies

### Phase 2 — Analysis
- [ ] Orb strength, dignity, combust flags
- [ ] Mitigations M1–M10, severity pipeline
- [ ] HI/GU content in data file

### Phase 3 — Polish
- [ ] 12 sign overlays; dasha note; chart highlight
- [ ] PDF section; Excel build script

---

## 24. Testing Strategy

| Case | Expected |
|------|----------|
| Jupiter + Rahu same sign | `present=true`, `guru_rahu` |
| Jupiter + Ketu same sign | `present=true`, `guru_ketu` |
| Same sign, 25° apart | `present=true`, `conjunction_strength=wide` |
| Jupiter alone | `present=false` |
| Jupiter Capricorn + Rahu | High severity |
| Jupiter Cancer + Ketu | Present + strong M1 |
| Combust Jupiter + node | `combust=true`, higher severity |
| 9th house Pisces (Tilak-like) | Bhagya type + strong positive_note potential |
| Cross-check JHora / Jagannath Hora articles | Regression |

---

## 25. Future Enhancements

| Item | Description |
|------|-------------|
| Shani Chandal | Saturn + nodes |
| Dasha panel | Jupiter/Rahu active periods |
| Mutual 5/9 aspect mode | Optional strict school toggle |
| Milan module | Guru Chandal in matching |
| Famous chart library | Educational examples |

---

## Appendix A — Feature Comparison

| Feature | Detection | Max findings | Classifier |
|---------|-----------|--------------|------------|
| Pitru Dosha | Many combos | Many | Per combination |
| Kaal Sarpa | 7 grahas in nodal arc | 1 | Rahu house |
| **Chandal** | Jupiter same sign as node | 1 | Jupiter house |

---

## Appendix B — Detection Pseudocode

```python
def detect_guru_chandal(by: dict) -> dict | None:
    jup = by.get("Jupiter")
    rahu = by.get("Rahu")
    ketu = by.get("Ketu")
    if not jup:
        return None
    js = jup["sign"]
    if rahu and js == rahu["sign"]:
        return {"variant": "guru_rahu", "node": rahu}
    if ketu and js == ketu["sign"]:
        return {"variant": "guru_ketu", "node": ketu}
    return None
```

---

## Appendix C — Bibliography & Web Sources (reviewed for v2.0)

| Source | Use |
|--------|-----|
| *Brihat Parashara Hora Shastra* | Jupiter, nodes, yogas, house lords |
| *Phaladeepika*, *Saravali* | Afflicted benefics, conjunction effects |
| B.V. Raman — *How to Judge a Horoscope* | Practical Guru affliction |
| [Jagannath Hora — Guru Chandal guide](https://jagannathhora.com/guru-chandal-dosha-jupiter-rahu-complete-guide/) | Cancellation, orb, constructive channels, KP notes |
| [AstroSight — Guru Chandal effects](https://astrosight.ai/doshas/guru-chandal-dosha-effects) | House themes, remedies, Jupiter-Ketu nuance |
| [Planetary Positions — Guru Chandal Yoga](https://planetarypositions.com/yoga/2015/11/14/guru-chandal-yoga/) | 5/9 aspect tradition, historical charts |
| [PocketPandit blog](https://blog.pocketpandit.com/guru-chandal-dosha/) | House-wise summaries |
| Amit Kumar Jha — Guru Chandal article | Shloka, extended affliction lists |
| Project: `Pitru_Dosha_Health_and_Modern_Solutions.xlsx` | Jupiter health / modern remedy phrasing |

---

*Document version: 2.0 — Kareer Studio Astrology. Revised for Parashari accuracy, multi-source Vedic review, and balanced classical/modern interpretation.*
