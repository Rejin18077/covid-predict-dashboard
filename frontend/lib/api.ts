// ─── Types ───────────────────────────────────────────────────────────────────
export interface DayForecast {
  date: string; // "YYYY-MM-DD"
  predicted_new_cases: number;
}

export interface ForecastResponse {
  region: string;
  horizon_days: number;
  last_known_date: string;
  last_known_cases: number;
  forecast: DayForecast[];
}

export interface RegionsResponse {
  regions: string[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  regions_available: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API Calls ───────────────────────────────────────────────────────────────
export const api = {
  health: () => apiFetch<HealthResponse>("/health"),

  regions: () => apiFetch<RegionsResponse>("/regions"),

  forecast: (region: string, horizon: number) =>
    apiFetch<ForecastResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify({ region, horizon }),
    }),
};
