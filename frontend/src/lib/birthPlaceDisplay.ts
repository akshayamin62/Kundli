/** Birth place column: place name, or lat/lon when only coordinates were entered. */
export function formatBirthPlaceDisplay(
  place?: string,
  lat?: number | null,
  lon?: number | null,
): string {
  const p = (place ?? "").trim();
  if (p) return p;
  if (lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
    return `Lat ${Number(lat).toFixed(4)}, Lon ${Number(lon).toFixed(4)}`;
  }
  return "—";
}
