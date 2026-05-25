"use client";

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

function buildPolygons(size: number): Record<number, Pt[]> {
  const c = size / 2;
  const q = size / 4;
  const q3 = (3 * size) / 4;

  return {
    1: [[c, 0], [q3, q], [c, c], [q, q]],
    2: [[0, 0], [c, 0], [q, q]],
    3: [[0, 0], [q, q], [0, c]],
    4: [[0, c], [q, q], [c, c], [q, q3]],
    5: [[0, size], [0, c], [q, q3]],
    6: [[c, size], [0, size], [q, q3]],
    7: [[c, size], [q, q3], [c, c], [q3, q3]],
    8: [[c, size], [size, size], [q3, q3]],
    9: [[size, c], [size, size], [q3, q3]],
    10: [[size, c], [q3, q3], [c, c], [q3, q]],
    11: [[size, 0], [size, c], [q3, q]],
    12: [[c, 0], [size, 0], [q3, q]],
  };
}

function buildCentroids(size: number): Record<number, Pt> {
  const polygons = buildPolygons(size);
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
  const size = 760;

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
      };
    })
    .filter((p): p is PlanetEntry => p !== null);

  const planetsByHouse: Record<number, PlanetEntry[]> = {};
  for (let h = 1; h <= 12; h++) planetsByHouse[h] = [];
  for (const p of planets) planetsByHouse[p.house].push(p);

  const polygons = buildPolygons(size);
  const centroids = buildCentroids(size);
  const diamondHouses = new Set([1, 4, 7, 10]);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="text-sm text-gray-600 text-center">
        <span className="font-semibold text-amber-700">Lagna:</span> {SIGN_NAMES[lagnaSign - 1]} ({lagnaSign})
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "auto" }}>
        <rect width={size} height={size} fill="#ffffff" />

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
          const points = polygons[house];
          const pointStr = points.map((p) => `${p[0]},${p[1]}`).join(" ");
          const [x, y] = centroids[house];
          const signNum = signByHouse[house] ?? houseToSign(house, lagnaSign);
          const inDiamond = diamondHouses.has(house);
          const isLagna = house === 1;
          const housePlanets = planetsByHouse[house];

          const signY = y - (isLagna ? 10 : inDiamond ? 6 : 5);
          const planetStartY = isLagna ? y + 18 : y + (inDiamond ? 10 : 8);
          const lineHeight = inDiamond ? 15 : 13;

          return (
            <g key={house}>
              <polygon
                points={pointStr}
                fill={isLagna ? "#ede9fe" : "#ffffff"}
                stroke="#6b7280"
                strokeWidth={1.4}
              />

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
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#6d28d9"
                  fontSize={18}
                  fontWeight="700"
                >
                  Lag
                </text>
              )}

              {housePlanets.map((p, idx) => (
                <text
                  key={`${house}-${p.name}-${idx}`}
                  x={x}
                  y={planetStartY + idx * lineHeight}
                  textAnchor="middle"
                  fill={p.color}
                  fontSize={16}
                  fontWeight="600"
                >
                  {p.label}
                </text>
              ))}
            </g>
          );
        })}

        <rect width={size} height={size} fill="none" stroke="#6b7280" strokeWidth={2} />
      </svg>
    </div>
  );
}
