# Pitru Dosha — data flow

## Principles

1. **Janma Rashi (Moon sign) alone does not create Pitru Dosha.**
2. **Detect** only combinations that literally exist in the chart (e.g. Sun+Rahu = same sign).
3. **Sign Wise Combos** → sign-wise impact, nature/theme, stronger houses — exact `(sign, combination)` match only.
4. **House Wise Combos** → house-wise impact, health focus — exact `(house, combination)` match only.
5. **No aliases** (e.g. `Rahu in 2nd` must not borrow `Sun + Rahu` sign text).
6. **UI lists only rows that exist** in Sign Wise or House Wise (no empty cards).
7. **Nodal sign-axis** (Sign Wise): opposite **rashi** pair; card shows **both** Rahu and Ketu signs. **Nodal house-axis** (House Wise): opposite **bhava** pair; card shows **both** Rahu and Ketu houses (with signs). One card per axis.

## Flow

```
Birth chart (D1)
    │
    ▼
Detect affliction (strict rules in pitru_dosha.py)
    │
    ├─► Sign Wise  → sign_wise_impact, sign_wise_severity, nature_theme, stronger_houses
    └─► House Wise → house_wise_impact, house_wise_severity, health_focus

## Severity (per row, no scoring)

- **Sign Wise `severity`** — from Dosha Matrix (`Pitru_Dosha_Health_and_Modern_Solutions.xlsx`), by combination name.
- **House Wise `severity`** — from Dosha Matrix when mapped; otherwise from House Severity Matrix (`Severity Matrix` sheet) by house number.

Regenerate after Excel changes: `python backend/scripts/build_pitru_dosha_data.py`
```

## Data (no Excel at runtime)

- `backend/app/data/pitru_dosha_data.py` — embedded from Excel
- Regenerate: `python backend/scripts/build_pitru_dosha_data.py`

## API

`POST /api/chart/pitru-dosha` — body: full chart JSON.
