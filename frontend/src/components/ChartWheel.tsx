"use client";

import { useState } from "react";
import { ChartResponse } from "@/types/chart";
import { type Lang, SIGN_NAMES as SIGN_NAMES_I18N, PLANET_SHORT as PLANET_SHORT_I18N, UI } from "@/lib/translations";

// English sign names used for sign→number lookup (always English from backend)
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_TO_NUM: Record<string, number> = Object.fromEntries(
  SIGN_NAMES.map((name, idx) => [name, idx + 1])
);

// Dignity-based coloring: default black; overridden per planet below
const DIGNITY_DEFAULT_COLOR = "#111827";

// Swakshetra (own sign)
const SWAKSHETRA: Record<string, string[]> = {
  Sun:          ["Leo"],
  Moon:         ["Cancer"],
  Mars:         ["Aries", "Scorpio"],
  Mercury:      ["Gemini", "Virgo"],
  Jupiter:      ["Sagittarius", "Pisces"],
  Venus:        ["Taurus", "Libra"],
  Saturn:       ["Capricorn", "Aquarius"],
  "North Node": ["Virgo"],
  "South Node": ["Pisces"],
};

// Uchcha (exaltation) sign
const UCHCHA: Record<string, string> = {
  Sun:          "Aries",
  Moon:         "Taurus",
  Mars:         "Capricorn",
  Mercury:      "Virgo",
  Jupiter:      "Cancer",
  Venus:        "Pisces",
  Saturn:       "Libra",
  "North Node": "Gemini",
  "South Node": "Sagittarius",
};

// Neecha (debilitation) sign
const NEECHA: Record<string, string> = {
  Sun:          "Libra",
  Moon:         "Scorpio",
  Mars:         "Cancer",
  Mercury:      "Pisces",
  Jupiter:      "Capricorn",
  Venus:        "Virgo",
  Saturn:       "Aries",
  "North Node": "Sagittarius",
  "South Node": "Gemini",
};

type DignityResult = { color: string; suffix: string };
function getDignity(planetName: string, sign: string): DignityResult {
  if (SWAKSHETRA[planetName]?.includes(sign)) return { color: "#15803d", suffix: "++" };
  if (UCHCHA[planetName] === sign)             return { color: "#1d4ed8", suffix: "+" };
  if (NEECHA[planetName] === sign)             return { color: "#dc2626", suffix: "\u2193" };
  return { color: DIGNITY_DEFAULT_COLOR, suffix: "" };
}

// Graha Drishti aspect strengths (from Grahshil Chakra / BPHS)
type AspectStrength = "ekpaad" | "dwipaad" | "tripaad" | "sampurna";
const ASPECT_COLORS: Record<AspectStrength, string> = {
  ekpaad:   "#000000",  // 1/4 — black
  dwipaad:  "#2563eb",  // 2/4 — blue
  tripaad:  "#16a34a",  // 3/4 — green
  sampurna: "#dc2626",  // 4/4 — red
};

function getAspects(planetName: string, fromHouse: number): { house: number; strength: AspectStrength }[] {
  const nth = (n: number) => ((fromHouse - 1 + n - 1) % 12) + 1;
  // Base aspects for ALL planets (Parashari Graha Drishti)
  const asp = new Map<number, AspectStrength>([
    [nth(3),  "ekpaad"],
    [nth(4),  "tripaad"],
    [nth(5),  "dwipaad"],
    [nth(7),  "sampurna"],
    [nth(8),  "tripaad"],
    [nth(9),  "dwipaad"],
    [nth(10), "ekpaad"],
  ]);
  // Special full-strength overrides
  if (planetName === "Mars") {
    asp.set(nth(4), "sampurna");
    asp.set(nth(8), "sampurna");
  } else if (planetName === "Jupiter") {
    asp.set(nth(5), "sampurna");
    asp.set(nth(9), "sampurna");
  } else if (planetName === "Saturn") {
    asp.set(nth(3), "sampurna");
    asp.set(nth(10), "sampurna");
  }
  return Array.from(asp.entries()).map(([house, strength]) => ({ house, strength }));
}

interface Props {
  chart: ChartResponse;
  lang?: Lang;
}

type Pt = [number, number];

interface PlanetEntry {
  name: string;
  label: string;
  color: string;
  suffix: string;
  retrograde: boolean;
  house: number;
  degree: number;
  minutes: number;
}

function normalizeDeg360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function houseToSign(house: number, lagnaSign: number): number {
  return ((lagnaSign - 1 + house - 1) % 12) + 1;
}

function signToHouse(sign: number, lagnaSign: number): number {
  return ((sign - lagnaSign + 12) % 12) + 1;
}

function buildPolygons(W: number, H: number): Record<number, Pt[]> {
  const cx = W / 2, cy = H / 2;
  // Outer vertices of the 4 diamond houses (1/16 of way from each border midpoint inward)
  const dx = W / 16, dy = H / 16;
  const d3x = (15 * W) / 16, d3y = (15 * H) / 16;
  // Inner square corners: midpoints between each diamond's outer vertex and chart center
  const ix = (dx + cx) / 2, iy = (dy + cy) / 2;
  const i3x = (d3x + cx) / 2, i3y = (d3y + cy) / 2;

  return {
    // 4 small diamond houses
    1:  [[cx,  dy],  [i3x, iy],  [cx,  cy],  [ix,  iy]],   // top diamond
    4:  [[dx,  cy],  [ix,  iy],  [cx,  cy],  [ix,  i3y]],  // left diamond
    7:  [[cx,  d3y], [ix,  i3y], [cx,  cy],  [i3x, i3y]],  // bottom diamond
    10: [[d3x, cy],  [i3x, i3y],[cx,  cy],  [i3x, iy]],   // right diamond
    // 8 outer quadrilateral houses
    // connector lines appear as shared edges: (cx,0)-(cx,dy), (0,cy)-(dx,cy), (cx,H)-(cx,d3y), (d3x,cy)-(W,cy)
    2:  [[0,  0],   [cx,  0],   [cx,  dy],  [ix,  iy]],   // top-left
    3:  [[0,  0],   [ix,  iy],  [dx,  cy],  [0,   cy]],   // left-upper
    5:  [[0,  H],   [0,   cy],  [dx,  cy],  [ix,  i3y]],  // left-lower
    6:  [[0,  H],   [cx,  H],   [cx,  d3y], [ix,  i3y]],  // bottom-left
    8:  [[cx, H],   [W,   H],   [i3x, i3y], [cx,  d3y]],  // bottom-right
    9:  [[W,  H],   [W,   cy],  [d3x, cy],  [i3x, i3y]],  // right-lower
    11: [[W,  0],   [W,   cy],  [d3x, cy],  [i3x, iy]],   // right-upper
    12: [[cx, 0],   [W,   0],   [i3x, iy],  [cx,  dy]],   // top-right
  };
}

function buildCentroids(W: number, H: number): Record<number, Pt> {
  const polygons = buildPolygons(W, H);
  const centroids: Record<number, Pt> = {};

  for (const [key, points] of Object.entries(polygons)) {
    const count = points.length;
    centroids[Number(key)] = [
      points.reduce((sum, p) => sum + p[0], 0) / count,
      points.reduce((sum, p) => sum + p[1], 0) / count,
    ];
  }

  return centroids;
}

function getInnerVertex(house: number, W: number, H: number): Pt {
  const cx = W / 2, cy = H / 2;
  const dx = W / 16, dy = H / 16;
  const d3x = (15 * W) / 16, d3y = (15 * H) / 16;
  // Inner square corners: midpoints between each diamond's outer vertex and chart center
  const ix = (dx + cx) / 2, iy = (dy + cy) / 2;
  const i3x = (d3x + cx) / 2, i3y = (d3y + cy) / 2;
  const v: Record<number, Pt> = {
    1:  [cx,  cy],   2:  [ix,  iy],   3:  [ix,  iy],
    4:  [cx,  cy],   5:  [ix,  i3y],  6:  [ix,  i3y],
    7:  [cx,  cy],   8:  [i3x, i3y],  9:  [i3x, i3y],
    10: [cx,  cy],   11: [i3x, iy],   12: [i3x, iy],
  };
  return v[house] ?? [cx, cy];
}

export default function ChartWheel({ chart, lang = "en" }: Props) {
  const W = 900;
  const H = 640;
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const planetShort = PLANET_SHORT_I18N[lang];
  const signNamesLang = SIGN_NAMES_I18N[lang];
  const ui = UI[lang];

  // In Vedic/Whole Sign mode, House 1 cusp sign is the authoritative Lagna sign.
  const house1 = chart.houses.find((h) => h.number === 1);
  const lagnaSignFromHouse = house1 ? SIGN_TO_NUM[house1.sign] : undefined;
  const lagnaSignFromAsc = Math.floor(normalizeDeg360(chart.angles.ascendant.longitude) / 30) + 1;
  const lagnaSign = lagnaSignFromHouse ?? lagnaSignFromAsc;

  const signByHouse: Record<number, number> = {};
  for (const h of chart.houses) {
    const n = SIGN_TO_NUM[h.sign];
    if (n) signByHouse[h.number] = n;
  }

  const planets: PlanetEntry[] = chart.planets
    .filter((p) => !["Uranus", "Neptune", "Pluto"].includes(p.name))
    .map((p) => {
      const signNum = SIGN_TO_NUM[p.sign];
      if (!signNum) return null;

      const derivedHouse = Number.isInteger(p.house) ? p.house : signToHouse(signNum, lagnaSign);
      const { color, suffix } = getDignity(p.name, p.sign);
      return {
        name: p.name,
        label: planetShort[p.name] ?? p.name,
        color,
        suffix,
        retrograde: !!p.retrograde,
        house: derivedHouse,
        degree: p.degree,
        minutes: p.minutes,
      };
    })
    .filter((p): p is PlanetEntry => p !== null);

  const planetsByHouse: Record<number, PlanetEntry[]> = {};
  for (let h = 1; h <= 12; h++) planetsByHouse[h] = [];
  for (const p of planets) planetsByHouse[p.house].push(p);

  const polygons = buildPolygons(W, H);
  const centroids = buildCentroids(W, H);
  const diamondHouses = new Set([1, 4, 7, 10]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="text-sm text-gray-600 text-center shrink-0 py-1">
        <span className="font-semibold text-amber-700">{ui.lagna}:</span> {signNamesLang[lagnaSign - 1]} ({lagnaSign})
      </div>

      <div className="flex-1 min-h-0">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" }}>
        <rect width={W} height={H} fill="#ffffff" />

        {/* Pass 1: house polygons */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
          const points = polygons[house];
          const pointStr = points.map((p) => `${p[0]},${p[1]}`).join(" ");
          const isLagna = house === 1;
          return (
            <polygon
              key={`poly-${house}`}
              points={pointStr}
              fill={isLagna ? "#ede9fe" : "#ffffff"}
              stroke="#6b7280"
              strokeWidth={1.4}
            />
          );
        })}

        {/* Pass 2: Vedic drishti aspect lines (below text labels) */}
        {(() => {
          if (!hoveredPlanet) return null;
          const hov = planets.find((p) => p.name === hoveredPlanet);
          if (!hov) return null;
          const aspects = getAspects(hov.name, hov.house);
          const [x1, y1] = centroids[hov.house];
          // Sort longest first so shorter (closer) lines are rendered last and appear on top,
          // preventing a far-house line from visually overwriting a near-house line.
          const sortedAspects = [...aspects].sort((a, b) => {
            const dA = Math.hypot(centroids[a.house][0] - x1, centroids[a.house][1] - y1);
            const dB = Math.hypot(centroids[b.house][0] - x1, centroids[b.house][1] - y1);
            return dB - dA;
          });
          return sortedAspects.map(({ house: targetHouse, strength }) => {
            const [x2, y2] = centroids[targetHouse];
            return (
              <line
                key={`asp-${targetHouse}`}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={ASPECT_COLORS[strength]}
                strokeWidth={2.5}
                strokeDasharray="8 4"
                opacity={0.85}
                strokeLinecap="round"
              />
            );
          });
        })()}

        {/* Pass 3: sign numbers toward chart center, planet labels at centroid */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
          const [x, y] = centroids[house];
          const signNum = signByHouse[house] ?? houseToSign(house, lagnaSign);
          const inDiamond = diamondHouses.has(house);
          const isLagna = house === 1;
          const housePlanets = planetsByHouse[house];

          // House sign number: 20% from inner vertex toward centroid
          const [ivX, ivY] = getInnerVertex(house, W, H);
          const numX = ivX + (x - ivX) * 0.22;
          const numY = ivY + (y - ivY) * 0.22;

          // Planet block: centered at centroid, no sign number in block
          const lineHeight = 45;
          const nPlanetRows = Math.ceil(housePlanets.length / 2);
          // headerH: space for Lag label + asc degree (house 1 only)
          const HEADER_H = isLagna ? 46 : 0;
          const blockH = HEADER_H + nPlanetRows * lineHeight;
          const MARGIN = 8;
          let blockTop = y - blockH / 2;
          blockTop = Math.max(MARGIN, Math.min(H - blockH - MARGIN, blockTop));
          const availForPlanets = (H - MARGIN) - (blockTop + HEADER_H);
          const effLH = nPlanetRows > 0
            ? Math.min(lineHeight, Math.max(26, availForPlanets / nPlanetRows))
            : lineHeight;
          const lagLabelY   = blockTop + 18;
          const ascDegLabelY = blockTop + 34;
          const planetStartY = blockTop + HEADER_H + Math.floor(effLH * 0.65);

          // Ascendant degree for House 1 display
          const ascDeg   = chart.angles.ascendant.degree;
          const ascMins  = chart.angles.ascendant.minutes;

          return (
            <g key={`text-${house}`}>
              {/* Sign number near inner vertex (toward chart center) */}
              <text
                x={numX}
                y={numY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#374151"
                fontSize={16}
                fontWeight="700"
              >
                {signNum}
              </text>

              {isLagna && (
                <>
                  <text
                    x={x}
                    y={lagLabelY}
                    textAnchor="middle"
                    fill="#6d28d9"
                    fontSize={18}
                    fontWeight="700"
                  >
                    {ui.lag}
                  </text>
                  <text
                    x={x}
                    y={ascDegLabelY}
                    textAnchor="middle"
                    fill="#6d28d9"
                    fontSize={12}
                    fontWeight="400"
                  >
                    {ascDeg}°{String(ascMins).padStart(2, "0")}′
                  </text>
                </>
              )}

              {housePlanets.map((p, idx) => {
                const total = housePlanets.length;
                const col = total > 1 ? idx % 2 : 0;
                const row = total > 1 ? Math.floor(idx / 2) : idx;
                const spread = inDiamond ? 40 : 40;
                const colOff = total === 1 ? 0 : col === 0 ? -spread : spread;
                const px = x + colOff;
                const py = planetStartY + row * effLH;
                return (
                  <text
                    key={`${house}-${p.name}-${idx}`}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    fill={p.color}
                    fontSize={22}
                    fontWeight="600"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredPlanet(p.name)}
                    onMouseLeave={() => setHoveredPlanet(null)}
                  >
                    {p.label}
                    {p.suffix && <tspan fill={p.color}>{p.suffix}</tspan>}
                    {p.retrograde && <tspan fill="#dc2626">-</tspan>}
                    {/* degree on its own sub-line so the name row stays narrow */}
                    <tspan x={px} dy={18} fontSize={16} fontWeight="400" fill="#000000">
                      {p.degree}°{String(p.minutes).padStart(2, "0")}′
                    </tspan>
                  </text>
                );
              })}
            </g>
          );
        })}

        <rect width={W} height={H} fill="none" stroke="#6b7280" strokeWidth={2} />
      </svg>
      </div>
    </div>
  );
}
