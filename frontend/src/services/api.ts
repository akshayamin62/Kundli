import { ChartRequest, ChartResponse, VargaRequest, DashaRequest, DashaResponse, TransitRequest, TransitResponse, MatchRequest, MatchResponse, HistoryItemSummary, HistoryItemFull } from "@/types/chart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function calculateChart(req: ChartRequest): Promise<ChartResponse> {
  const res = await fetch(`${API_URL}/api/chart/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function calculateVarga(req: VargaRequest): Promise<ChartResponse> {
  const res = await fetch(`${API_URL}/api/chart/varga`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function calculateVargaBulk(req: ChartRequest, ns: number[]): Promise<Record<number, ChartResponse>> {
  const res = await fetch(`${API_URL}/api/chart/varga-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, ns }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  const raw = await res.json() as Record<string, ChartResponse>;
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [Number(k), v])
  ) as Record<number, ChartResponse>;
}

export async function calculateDasha(req: DashaRequest): Promise<DashaResponse> {
  const res = await fetch(`${API_URL}/api/chart/dasha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function calculateTransit(req: TransitRequest): Promise<TransitResponse> {
  const res = await fetch(`${API_URL}/api/chart/transit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function listHouseSystems(): Promise<{ systems: { id: string; name: string; description: string }[] }> {
  const res = await fetch(`${API_URL}/api/chart/house-systems`);
  return res.json();
}

export async function calculateMatch(req: MatchRequest): Promise<MatchResponse> {
  const res = await fetch(`${API_URL}/api/match/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" })) as {
      detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>;
    };
    if (Array.isArray(err.detail)) {
      const details = err.detail
        .map((d) => {
          const loc = Array.isArray(d.loc) ? d.loc.join(".") : "request";
          return `${loc}: ${d.msg ?? "Invalid value"}`;
        })
        .join(" | ");
      throw new Error(details || `HTTP ${res.status}`);
    }
    throw new Error(err.detail || `HTTP ${res.status}`);
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
  const res = await fetch(`${API_URL}/api/history?${qs.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchHistoryItem(id: string): Promise<HistoryItemFull> {
  const res = await fetch(`${API_URL}/api/history/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/history/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
}

export async function lookupHistoryId(
  type: "kundali" | "match",
  input: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/history/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, input }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
