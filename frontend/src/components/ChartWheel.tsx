"use client";

import { useState } from "react";
import { ChartResponse } from "@/types/chart";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_TO_NUM: Record<string, number> = Object.fromEntries(
  SIGN_NAMES.map((name, idx) => [name, idx + 1])
);

const PLANET_SHORT: Record<string, string> = {
  Sun: "Sun",
  Moon: "Moon",
  Mars: "Mars",
  Mercury: "Mer",
  Jupiter: "Jup",
  Venus: "Ven",
  Saturn: "Sat",
  Uranus: "Ura",
  Neptune: "Nep",
  Pluto: "Plu",
  "North Node": "Rah",
  "South Node": "Ket",
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "#b45309",
  Moon: "#64748b",
  Mars: "#dc2626",
  Mercury: "#059669",
  Jupiter: "#c2410c",
  Venus: "#be185d",
  Saturn: "#475569",
  Uranus: "#0369a1",
  Neptune: "#4338ca",
  Pluto: "#7c3aed",
  "North Node": "#1d4ed8",
  "South Node": "#92400e",
};

interface Props {
  chart: ChartResponse;
}

type Pt = [number, number];

interface PlanetEntry {
  name: string;
  label: string;
  color: string;
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

// Vedic drishti — returns list of house numbers aspected from `fromHouse`
function getAspectedHouses(planetName: string, fromHouse: number): number[] {
  const nth = (n: number) => ((fromHouse - 1 + n - 1) % 12) + 1;
  const houses = [nth(7)]; // universal 7th-house aspect
  if (planetName === "Jupiter") {
    houses.push(nth(5), nth(9));
  } else if (planetName === "Mars") {
    houses.push(nth(4), nth(8));
  } else if (planetName === "Saturn") {
    houses.push(nth(3), nth(10));
  } else if (planetName === "North Node" || planetName === "South Node") {
    houses.push(nth(5), nth(9));
  }
  return houses;
}

function buildPolygons(W: number, H: number): Record<number, Pt[]> {
  const cx = W / 2, cy = H / 2;
  const qx = W / 4, qy = H / 4;
  const q3x = (3 * W) / 4, q3y = (3 * H) / 4;

  return {
    1:  [[cx, 0],  [q3x, qy],  [cx, cy],  [qx, qy]],
    2:  [[0, 0],   [cx, 0],    [qx, qy]],
    3:  [[0, 0],   [qx, qy],   [0, cy]],
    4:  [[0, cy],  [qx, qy],   [cx, cy],  [qx, q3y]],
    5:  [[0, H],   [0, cy],    [qx, q3y]],
    6:  [[cx, H],  [0, H],     [qx, q3y]],
    7:  [[cx, H],  [qx, q3y],  [cx, cy],  [q3x, q3y]],
    8:  [[cx, H],  [W, H],     [q3x, q3y]],
    9:  [[W, cy],  [W, H],     [q3x, q3y]],
    10: [[W, cy],  [q3x, q3y], [cx, cy],  [q3x, qy]],
    11: [[W, 0],   [W, cy],    [q3x, qy]],
    12: [[cx, 0],  [W, 0],     [q3x, qy]],
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

export default function ChartWheel({ chart }: Props) {
  const W = 900;
  const H = 640;
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

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
    .map((p) => {
      const signNum = SIGN_TO_NUM[p.sign];
      if (!signNum) return null;

      // Prefer backend-computed house assignment. If unavailable, fallback to sign->house conversion.
      const derivedHouse = Number.isInteger(p.house) ? p.house : signToHouse(signNum, lagnaSign);
      return {
        name: p.name,
        label: (PLANET_SHORT[p.name] ?? p.name) + (p.retrograde ? "R" : ""),
        color: PLANET_COLORS[p.name] ?? "#e2e8f0",
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
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="text-sm text-gray-600 text-center">
        <span className="font-semibold text-amber-700">Lagna:</span> {SIGN_NAMES[lagnaSign - 1]} ({lagnaSign})
      </div>

      <div style={{ width: "min(100%, calc((100vh - 260px) * 1.40625))", margin: "0 auto" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
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
          const aspHouses = getAspectedHouses(hov.name, hov.house);
          const [x1, y1] = centroids[hov.house];
          return aspHouses.map((targetHouse) => {
            const [x2, y2] = centroids[targetHouse];
            return (
              <line
                key={`asp-${targetHouse}`}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke="#dc2626"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                opacity={0.85}
                strokeLinecap="round"
              />
            );
          });
        })()}

        {/* Pass 3: sign numbers and planet labels (on top of lines) */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
          const [x, y] = centroids[house];
          const signNum = signByHouse[house] ?? houseToSign(house, lagnaSign);
          const inDiamond = diamondHouses.has(house);
          const isLagna = house === 1;
          const housePlanets = planetsByHouse[house];

          // House 1: sign(y-52) → Lag(y-22) → ASC deg(y-6) → planets(y+12)
          // Other diamond: sign(y-10) → planets(y+12)
          // Triangle:      sign(y-8)  → planets(y+10)
          const signY = y - (isLagna ? 52 : inDiamond ? 10 : 8);
          const planetStartY = isLagna ? y + 12 : y + (inDiamond ? 12 : 10);
          // 32px per row: 14px name + 14px degree sub-line + 4px gap
          const lineHeight = 32;

          // Ascendant degree for House 1 display
          const ascDeg   = chart.angles.ascendant.degree;
          const ascMins  = chart.angles.ascendant.minutes;

          return (
            <g key={`text-${house}`}>
              <text
                x={x}
                y={signY}
                textAnchor="middle"
                fill="#374151"
                fontSize={inDiamond ? 28 : 22}
                fontWeight="600"
              >
                {signNum}
              </text>

              {isLagna && (
                <>
                  <text
                    x={x}
                    y={y - 22}
                    textAnchor="middle"
                    fill="#6d28d9"
                    fontSize={16}
                    fontWeight="700"
                  >
                    Lag
                  </text>
                  <text
                    x={x}
                    y={y - 6}
                    textAnchor="middle"
                    fill="#6d28d9"
                    fontSize={10}
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
                const py = planetStartY + row * lineHeight;
                return (
                  <text
                    key={`${house}-${p.name}-${idx}`}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    fill={p.color}
                    fontSize={14}
                    fontWeight="600"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredPlanet(p.name)}
                    onMouseLeave={() => setHoveredPlanet(null)}
                  >
                    {p.label}
                    {/* degree on its own sub-line so the name row stays narrow */}
                    <tspan fontSize={10} fontWeight="400" fill="#000000">
                      {"  "}{p.degree}°{String(p.minutes).padStart(2, "0")}′
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
