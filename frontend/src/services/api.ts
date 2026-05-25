import { ChartRequest, ChartResponse } from "@/types/chart";

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

export async function listHouseSystems(): Promise<{ systems: { id: string; name: string; description: string }[] }> {
  const res = await fetch(`${API_URL}/api/chart/house-systems`);
  return res.json();
}
