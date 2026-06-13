/** Approximate bounding box for India. */
function isInIndia(lat?: number, lon?: number): boolean {
  if (lat == null || lon == null) return false;
  return lat >= 6 && lat <= 37.5 && lon >= 68 && lon <= 97.5;
}

/**
 * Show a friendly IANA timezone label instead of rough backend fallbacks
 * (e.g. Etc/GMT+5 → Asia/Kolkata for Indian birth places).
 */
export function formatTimezoneDisplay(
  timezone: string,
  options?: { utcOffset?: string; latitude?: number; longitude?: number },
): string {
  if (timezone === "Asia/Kolkata") return "Asia/Kolkata";

  const { utcOffset, latitude, longitude } = options ?? {};

  if (
    timezone.startsWith("Etc/GMT") &&
    (utcOffset === "+05:30" || isInIndia(latitude, longitude))
  ) {
    return "Asia/Kolkata";
  }

  if (isInIndia(latitude, longitude)) {
    return "Asia/Kolkata";
  }

  return timezone;
}
