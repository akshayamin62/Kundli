export interface PlaceSuggestion {
  id: string;
  label: string;   // short "City, State, Country"
  lat: number;
  lon: number;
}

function formatLabel(props: {
  name?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
}): string {
  const parts: string[] = [];
  if (props.name) parts.push(props.name);
  if (props.city && props.city !== props.name) parts.push(props.city);
  if (props.state && props.state !== props.city && props.state !== props.name)
    parts.push(props.state);
  if (props.country) parts.push(props.country);
  return parts.filter(Boolean).join(", ") || "Unknown location";
}

/**
 * Autocomplete using Photon (Komoot) — free, no API key, OSM-backed.
 * Returns short "City, State, Country" labels plus coordinates.
 */
export async function fetchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json() as {
      features: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          name?: string;
          city?: string;
          district?: string;
          state?: string;
          country?: string;
          osm_id?: number;
          osm_type?: string;
        };
      }>;
    };
    const seen = new Set<string>();
    const out: PlaceSuggestion[] = [];
    for (let i = 0; i < (data.features ?? []).length && out.length < 6; i++) {
      const f = data.features[i];
      const lon = f.geometry.coordinates[0];
      const lat = f.geometry.coordinates[1];
      const label = formatLabel(f.properties);
      const dedupeKey = `${label}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      out.push({
        id: `${i}-${lat.toFixed(5)}-${lon.toFixed(5)}`,
        label,
        lat,
        lon,
      });
    }
    return out;
  } catch {
    return [];
  }
}
