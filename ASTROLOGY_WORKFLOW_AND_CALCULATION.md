# Astrology App Workflow and Backend Calculation Guide

This document explains the full flow from user input to chart output, including API behavior and backend calculation steps.

## 1. End-to-End User Workflow

1. User opens frontend UI and fills:
   - Birth date
   - Birth time
   - Birth place
2. Frontend sends a POST request to backend:
   - Endpoint: `/api/chart/calculate`
   - Mode currently set for North Indian chart defaults:
     - `house_system = whole_sign`
     - `zodiac = sidereal`
3. Backend validates input and geocodes place.
4. Backend converts local birth time to UTC.
5. Backend computes astronomy values (Julian Day, obliquity, sidereal time, ASC/MC).
6. Backend computes house cusps from house system.
7. Backend computes planetary longitudes using high-accuracy ephemeris pipeline.
8. Backend returns structured chart JSON.
9. Frontend renders:
   - North Indian square chart (Rashi style)
   - House details table

## 2. API Workflow

### 2.1 Main Calculation API

- Method: `POST`
- URL: `/api/chart/calculate`
- Request body (ChartRequest):

```json
{
  "birth_date": "YYYY-MM-DD",
  "birth_time": "HH:MM",
  "birth_place": "City, Country",
  "house_system": "whole_sign",
  "zodiac": "sidereal"
}
```

### 2.2 Response Shape

Backend returns:
- `meta`: input and computed metadata (timezone, UTC, JD, selected modes)
- `angles`: ascendant, midheaven, descendant, IC
- `houses`: 12 house cusps
- `planets`: planetary positions with house and retrograde flag

### 2.3 House Systems API

- Method: `GET`
- URL: `/api/chart/house-systems`
- Purpose: list all supported systems (Placidus, Koch, Equal, Whole Sign, Porphyry, Regiomontanus, Campanus)

## 3. Backend Calculation Pipeline

## 3.1 Input and Validation

- Date/time format checked in Pydantic schema.
- House system and zodiac validated against allowed literals.

## 3.2 Geocoding and Timezone

- Place string is geocoded to latitude/longitude.
- Timezone is resolved from coordinates.
- Local birth datetime is converted to UTC datetime.

## 3.3 Core Astronomy

Given UTC datetime:
1. Compute Julian Day (`jd`).
2. Compute Delta-T and TT-adjusted JD (`jd_tt`).
3. Compute mean obliquity of ecliptic (`eps`).
4. Compute Local Sidereal Time / RAMC.
5. Compute:
   - MC longitude
   - Ascendant longitude

If zodiac is sidereal:
- Compute ayanamsa and subtract from tropical longitudes.

## 3.4 Houses

`calculate_house_cusps(house_system, ramc, eps, lat, mc, asc)` dispatches to selected algorithm:
- Placidus
- Koch
- Equal
- Whole Sign
- Porphyry
- Regiomontanus
- Campanus

In current North Indian mode, Whole Sign is used:
- House 1 starts at start of Ascendant sign.
- Each next house advances by 30 degrees.

## 3.5 Planet Positions (High Accuracy)

Accuracy priority in backend:
1. Swiss Ephemeris binding (`pyswisseph`) if available.
2. Skyfield + JPL DE421 ephemeris (high-accuracy fallback).
3. Internal low-precision fallback (only if above unavailable).

This means current build uses high-accuracy JPL mode when pyswisseph is not installed.

## 3.6 Planet to House Mapping

For each planet longitude:
- Compare against consecutive house cusp intervals.
- Assign 1..12 house index.

## 3.7 North Indian Chart Rendering Rule

Frontend North Indian chart is Rashi-oriented:
- Houses are fixed in North Indian square geometry.
- Sign progression follows Lagna (Ascendant sign).
- Planets are placed sign-wise (Vedic style).
- Ketu is derived as Rahu + 180 degrees.

## 4. Worked Example (Real Output)

This example was generated from the running backend.

### 4.1 Example Input

```json
{
  "birth_date": "1995-08-25",
  "birth_time": "14:35",
  "birth_place": "Mumbai, India",
  "house_system": "whole_sign",
  "zodiac": "sidereal"
}
```

### 4.2 Key Computed Metadata

- Geocoded place: Mumbai, Mumbai Suburban District, Maharashtra, 400051, India
- Latitude: 19.054999
- Longitude: 72.869203
- Timezone: Asia/Kolkata
- UTC offset: +05:30
- UTC datetime: 1995-08-25T09:05:00Z
- Julian Day: 2449954.878472
- House system: Whole Sign
- Zodiac: Sidereal

### 4.3 Key Angles

- Ascendant: 240.616562 deg (Sagittarius 0d 36m 59s)
- Midheaven: 158.914806 deg (Virgo 8d 54m 53s)
- Descendant: 60.616562 deg (Gemini 0d 36m 59s)
- IC: 338.914806 deg (Pisces 8d 54m 53s)

### 4.4 House Cusps (Whole Sign)

1. Sagittarius 240 deg
2. Capricorn 270 deg
3. Aquarius 300 deg
4. Pisces 330 deg
5. Aries 0 deg
6. Taurus 30 deg
7. Gemini 60 deg
8. Cancer 90 deg
9. Leo 120 deg
10. Virgo 150 deg
11. Libra 180 deg
12. Scorpio 210 deg

### 4.5 Selected Planet Results

- Sun: Leo 7d 51m 30s, house 9
- Moon: Cancer 28d 21m 03s, house 8
- Mercury: Virgo 1d 01m 17s, house 10
- Venus: Leo 9d 03m 35s, house 9
- Mars: Virgo 27d 44m 01s, house 10
- Jupiter: Scorpio 12d 27m 20s, house 12
- Rahu (North Node): Libra 5d 23m 52s, house 11
- Ketu (derived on frontend): Aries 5d 23m 52s, house 5

## 5. Quick Verification Checklist

If user reports mismatch, check in order:

1. Input place geocoding is correct (right city/country).
2. Timezone and UTC conversion are correct.
3. Zodiac mode is sidereal for North Indian charts.
4. House system is whole_sign for Rashi-style chart.
5. Backend ephemeris path is high-accuracy (Skyfield/JPL or Swiss Ephemeris).
6. Ascendant sign and house 1 alignment are correct.

## 6. Notes

- If `pyswisseph` becomes available later, backend will automatically prefer it.
- Current system is already in high-accuracy mode using Skyfield + JPL DE421.

## 7. Detailed Step-by-Step Example (02/10/2004, 12:15 PM, Vadodara)

This is the exact requested example.

Assumption used:
- Date interpreted as DD/MM/YYYY, so `02/10/2004` means `2004-10-02`.
- Time interpreted as `12:15` in 24-hour format (local clock).

### 7.1 Input

```json
{
   "birth_date": "2004-10-02",
   "birth_time": "12:15",
   "birth_place": "Vadodara, India",
   "house_system": "whole_sign",
   "zodiac": "sidereal"
}
```

### 7.2 Step 1: Geocoding

- Resolved place: Vadodara, Vadodara Rural Taluka, Vadodara, Gujarat, 390001, India
- Latitude: 22.297314
- Longitude: 73.194257

### 7.3 Step 2: Timezone and UTC conversion

- Timezone: Asia/Kolkata
- UTC offset: +05:30
- Local datetime: 2004-10-02T12:15:00
- UTC datetime: 2004-10-02T06:45:00Z
- UT hours: 6.75

### 7.4 Step 3: Core astronomical quantities

From backend astronomy pipeline:

- Julian Day (UT): 2453280.78125
- Delta-T (seconds): 64.611179
- Julian Day (TT): 2453280.781998
- T centuries from J2000: 0.04752312109
- Mean obliquity (deg): 23.438673112
- RAMC / Local Sidereal Time (deg): 186.043043865
- Ayanamsa (deg): 23.850646314

Tropical angle results before ayanamsa subtraction:
- MC tropical (deg): 186.581947226
- ASC tropical (deg): 266.172769554

Sidereal angle results after ayanamsa subtraction:
- MC sidereal (deg): 162.731300912
- ASC sidereal (deg): 242.32212324

### 7.5 Step 4: Angles (formatted)

- Ascendant: 2°19'19" Sagittarius
- Midheaven: 12°43'52" Virgo
- Descendant: 2°19'19" Gemini
- IC: 12°43'52" Pisces

### 7.6 Step 5: Whole Sign house cusps

Because house system is Whole Sign and Lagna sign is Sagittarius:

1. House 1 cusp: 0° Sagittarius (240°)
2. House 2 cusp: 0° Capricorn (270°)
3. House 3 cusp: 0° Aquarius (300°)
4. House 4 cusp: 0° Pisces (330°)
5. House 5 cusp: 0° Aries (0°)
6. House 6 cusp: 0° Taurus (30°)
7. House 7 cusp: 0° Gemini (60°)
8. House 8 cusp: 0° Cancer (90°)
9. House 9 cusp: 0° Leo (120°)
10. House 10 cusp: 0° Virgo (150°)
11. House 11 cusp: 0° Libra (180°)
12. House 12 cusp: 0° Scorpio (210°)

### 7.7 Step 6: Planet longitudes and house mapping

Computed by high-accuracy ephemeris path (Skyfield + JPL in current setup):

- Sun: 15°33'41" Virgo (165.561434°) -> House 10
- Moon: 29°56'02" Aries (29.934086°) -> House 5
- Mercury: 12°49'23" Virgo (162.823242°) -> House 10
- Venus: 4°28'53" Leo (124.481496°) -> House 9
- Mars: 9°57'40" Virgo (159.961209°) -> House 10
- Jupiter: 7°41'23" Virgo (157.689877°) -> House 10
- Saturn: 2°15'02" Cancer (92.250666°) -> House 8
- Uranus: 9°40'03" Aquarius (309.667679°) -> House 3 (retrograde)
- Neptune: 18°53'25" Capricorn (288.890309°) -> House 2 (retrograde)
- Pluto: 25°58'36" Scorpio (235.976874°) -> House 12
- North Node (Rahu): 9°16'39" Aries (9.277704°) -> House 5 (retrograde)

Ketu (derived in frontend for North Indian chart):
- Ketu longitude = Rahu + 180° = 189.277704°
- Ketu sign = Libra
- Ketu house (Whole Sign from Sagittarius Lagna) = House 11

### 7.8 Final interpretation for chart rendering

- Lagna = Sagittarius, so North Indian chart starts with Sagittarius in House 1.
- Planets are placed sign-wise into fixed North Indian house geometry.
- This gives a Vedic-style Rashi chart using sidereal zodiac and Whole Sign logic.
