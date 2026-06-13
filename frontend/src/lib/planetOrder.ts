/** Traditional Vedic display order (after Ascendant). */
export const PLANET_TABLE_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "North Node",
  "South Node",
] as const;

const ORDER_INDEX = new Map<string, number>(
  PLANET_TABLE_ORDER.map((name, i) => [name, i]),
);

export function sortPlanetsForTable<T extends { name: string }>(planets: T[]): T[] {
  return [...planets].sort((a, b) => {
    const ia = ORDER_INDEX.get(a.name) ?? 999;
    const ib = ORDER_INDEX.get(b.name) ?? 999;
    return ia - ib;
  });
}
