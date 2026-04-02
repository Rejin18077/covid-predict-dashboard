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
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const CANDIDATE_BASE_URLS = [
  configuredApiUrl,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
].filter((url): url is string => Boolean(url));

let resolvedBaseUrl: string | null = configuredApiUrl ?? null;

async function resolveBaseUrl(): Promise<string> {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  for (const baseUrl of CANDIDATE_BASE_URLS) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        resolvedBaseUrl = baseUrl;
        return baseUrl;
      }
    } catch {
      // Try next candidate.
    }
  }

  throw new Error("Unable to reach backend API. Start backend on port 8000 or 8080, or set NEXT_PUBLIC_API_URL.");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = await resolveBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
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
