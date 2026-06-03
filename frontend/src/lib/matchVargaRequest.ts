import { ChartResponse, MatchPersonRequest, VargaRequest } from "@/types/chart";

/** Build varga API payload from chart meta + stored person (coords when place empty). */
export function vargaRequestForPerson(
  chart: ChartResponse,
  person: MatchPersonRequest,
  n: number,
): VargaRequest {
  const meta = chart.meta;
  const place = (person.birth_place ?? meta.birth_place ?? "").trim();
  const lat = person.birth_lat ?? meta.latitude;
  const lon = person.birth_lon ?? meta.longitude;

  return {
    name: person.name,
    birth_date: meta.birth_date,
    birth_time: meta.birth_time,
    birth_place: place || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    birth_lat: lat,
    birth_lon: lon,
    house_system: person.house_system ?? meta.house_system,
    zodiac: person.zodiac ?? meta.zodiac,
    save_history: false,
    n,
  };
}
