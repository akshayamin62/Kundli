import { ChartRequest, ChartResponse, VargaRequest, DashaRequest, DashaResponse, TransitRequest, TransitResponse, MatchRequest, MatchResponse, HistoryItemSummary, HistoryItemFull, PitruDoshaResponse, KaalSarpaResponse, ChandalDoshaResponse } from "@/types/chart";
import { authHeaders, clearAuth } from "@/lib/authStorage";
import { normalizeChartRequest, normalizeZodiac } from "@/lib/chartRequestNormalize";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function parseApiError(err: { detail?: string | Array<{ msg?: string; loc?: Array<string | number> }> }, status: number): string {
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((d) => {
        const loc = Array.isArray(d.loc) ? d.loc.join(".") : "request";
        return `${loc}: ${d.msg ?? "Invalid value"}`;
      })
      .join(" | ") || `HTTP ${status}`;
  }
  if (typeof err.detail === "string") return err.detail;
  return `HTTP ${status}`;
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: authHeaders(init?.headers),
  });
  if (res.status === 401 && typeof window !== "undefined") {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }
  return res;
}

export async function calculatePitruDosha(chart: ChartResponse): Promise<PitruDoshaResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/pitru-dosha`, {
    method: "POST",
    body: JSON.stringify(chart),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
  return res.json();
}

export async function calculateKaalSarpa(chart: ChartResponse): Promise<KaalSarpaResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/kaal-sarpa`, {
    method: "POST",
    body: JSON.stringify(chart),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
  return res.json();
}

export async function calculateChandalDosha(chart: ChartResponse): Promise<ChandalDoshaResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/chandal-dosha`, {
    method: "POST",
    body: JSON.stringify(chart),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
  return res.json();
}

export async function calculateChart(req: ChartRequest): Promise<ChartResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/calculate`, {
    method: "POST",
    body: JSON.stringify(normalizeChartRequest(req)),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

export async function calculateVarga(req: VargaRequest): Promise<ChartResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/varga`, {
    method: "POST",
    body: JSON.stringify(normalizeChartRequest(req)),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

export async function calculateVargaBulk(req: ChartRequest, ns: number[]): Promise<Record<number, ChartResponse>> {
  const res = await apiFetch(`${API_URL}/api/chart/varga-bulk`, {
    method: "POST",
    body: JSON.stringify({ ...normalizeChartRequest(req), ns }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  const raw = await res.json() as Record<string, ChartResponse>;
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [Number(k), v])
  ) as Record<number, ChartResponse>;
}

export async function calculateDasha(req: DashaRequest): Promise<DashaResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/dasha`, {
    method: "POST",
    body: JSON.stringify({
      ...normalizeChartRequest(req),
      years_ahead: req.years_ahead ?? 120,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

export async function calculateTransit(req: TransitRequest): Promise<TransitResponse> {
  const res = await apiFetch(`${API_URL}/api/chart/transit`, {
    method: "POST",
    body: JSON.stringify({ ...req, zodiac: normalizeZodiac(req.zodiac) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

export async function listHouseSystems(): Promise<{ systems: { id: string; name: string; description: string }[] }> {
  const res = await apiFetch(`${API_URL}/api/chart/house-systems`);
  return res.json();
}

export async function calculateMatch(req: MatchRequest): Promise<MatchResponse> {
  const res = await apiFetch(`${API_URL}/api/match/calculate`, {
    method: "POST",
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }

  return res.json();
}

// ── History ──────────────────────────────────────────────────────────────────

export async function fetchHistory(params?: {
  search?: string;
  type?: "kundali" | "match" | "";
  limit?: number;
  skip?: number;
}): Promise<{ items: HistoryItemSummary[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.type) qs.set("type", params.type);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.skip != null) qs.set("skip", String(params.skip));
  const res = await apiFetch(`${API_URL}/api/history?${qs.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchHistoryItem(id: string): Promise<HistoryItemFull> {
  const res = await apiFetch(`${API_URL}/api/history/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
  return res.json();
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/api/history/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
}

export async function lookupHistoryId(
  type: "kundali" | "match",
  input: Record<string, unknown>,
): Promise<string> {
  const res = await apiFetch(`${API_URL}/api/history/lookup`, {
    method: "POST",
    body: JSON.stringify({ type, input }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(parseApiError(err, res.status));
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
