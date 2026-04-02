"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import Header from "@/components/Header";
import MapSidebar from "@/components/MapSidebar";
import ForecastChart from "@/components/ForecastChart";
import StatCard from "@/components/StatCard";

import { api, type ForecastResponse } from "@/lib/api";
import { getCountryCoords } from "@/lib/countryCoords";
import type { HeatmapPoint } from "@/components/CovidMap";

// Dynamically import the map so Leaflet is never server-side rendered
const CovidMap = dynamic(() => import("@/components/CovidMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-card)] rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading map…</p>
      </div>
    </div>
  ),
});

// ─── Heatmap seeding (loaded once from regions API) ──────────────────────────
// We call /regions and query 1-day forecasts in batches to derive
// last_known_cases-driven intensity for global map points.

export default function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");
  const [regions, setRegions] = useState<string[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([]);
  const [heatLoading, setHeatLoading] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("india");
  const [horizon, setHorizon] = useState(14);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const normalizeHeatPoints = useCallback((points: Omit<HeatmapPoint, "intensity">[]): HeatmapPoint[] => {
    const maxCases = Math.max(...points.map((p) => p.rawCases), 1);
    return points.map((p) => ({
      ...p,
      // Sqrt scaling keeps low-mid values visible while preserving peaks.
      intensity: Math.sqrt(p.rawCases / maxCases),
    }));
  }, []);

  // ── 1. Seed heatmap across all regions with known coordinates ─────────────
  const seedHeatmap = useCallback(async (list: string[]) => {
    setHeatLoading(true);
    try {
      const mapped = list.filter((r) => getCountryCoords(r) !== null);
      const batchSize = 20;
      const rawPoints: Omit<HeatmapPoint, "intensity">[] = [];

      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((r) => api.forecast(r, 1)));

        results.forEach((res, idx) => {
          if (res.status !== "fulfilled") return;
          const region = batch[idx];
          const coords = getCountryCoords(region);
          if (!coords) return;

          rawPoints.push({
            region,
            lat: coords[0],
            lng: coords[1],
            rawCases: res.value.last_known_cases,
          });
        });
      }

      setHeatPoints(normalizeHeatPoints(rawPoints));
    } finally {
      setHeatLoading(false);
    }
  }, [normalizeHeatPoints]);

  // ── 2. Health check + load regions ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await api.health();
        setApiStatus("ok");
        const { regions: list } = await api.regions();
        setRegions(list);
        if (list.length > 0) setSelectedRegion(list.find(r => r === "india") ?? list[0]);
        seedHeatmap(list);
      } catch {
        setApiStatus("error");
      }
    })();
  }, [seedHeatmap]);

  // ── 3. Run forecast ─────────────────────────────────────────────────────────
  const runForecast = useCallback(async () => {
    if (!selectedRegion) return;
    setForecastLoading(true);
    setForecastError(null);
    try {
      const res = await api.forecast(selectedRegion, horizon);
      setForecast(res);

      // Update heatmap point for this region too
      const coords = getCountryCoords(selectedRegion);
      if (coords) {
        setHeatPoints((prev) => {
          const exists = prev.some((p) => p.region === selectedRegion);
          const raw = prev.map((p) => ({
            region: p.region,
            lat: p.lat,
            lng: p.lng,
            rawCases: p.region === selectedRegion ? res.last_known_cases : p.rawCases,
          }));

          if (!exists) {
            raw.push({
              region: selectedRegion,
              lat: coords[0],
              lng: coords[1],
              rawCases: res.last_known_cases,
            });
          }

          return normalizeHeatPoints(raw);
        });
      }
    } catch (e) {
      setForecastError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setForecastLoading(false);
    }
  }, [selectedRegion, horizon, normalizeHeatPoints]);

  // ── Auto-run forecast when region changes ───────────────────────────────────
  useEffect(() => {
    if (regions.length > 0 && selectedRegion) runForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, regions]);

  // ── Map click → select region ───────────────────────────────────────────────
  const handleRegionClick = useCallback(
    (region: string) => {
      if (regions.includes(region)) setSelectedRegion(region);
    },
    [regions]
  );

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalHeatCases = heatPoints.reduce((s, p) => s + p.rawCases, 0);
  const peakRegion = heatPoints.length
    ? heatPoints.reduce((a, b) => (a.rawCases > b.rawCases ? a : b))
    : null;
  const avgForecast = forecast
    ? Math.round(forecast.forecast.reduce((s, d) => s + d.predicted_new_cases, 0) / (forecast.forecast.length || 1))
    : null;
  const maxForecast = forecast
    ? Math.max(...forecast.forecast.map((d) => d.predicted_new_cases))
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] bg-grid flex flex-col">
      <Header apiStatus={apiStatus} regionsCount={regions.length} />

      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-5 max-w-screen-2xl mx-auto w-full">

        {/* ── Hero stat row ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Regions Tracked"
            value={heatPoints.length || "—"}
            sub="live heatmap nodes"
            color="blue"
            icon="🌍"
          />
          <StatCard
            label="Total Sampled Cases"
            value={totalHeatCases > 0 ? (totalHeatCases >= 1_000_000 ? `${(totalHeatCases / 1_000_000).toFixed(1)}M` : `${(totalHeatCases / 1_000).toFixed(0)}K`) : "—"}
            sub="across all heatmap regions"
            color="red"
            icon="🔴"
            pulse={totalHeatCases > 0}
          />
          <StatCard
            label="Avg Daily Forecast"
            value={avgForecast !== null ? avgForecast.toLocaleString() : "—"}
            sub={forecast ? `for ${forecast.region}` : "run a forecast"}
            color="cyan"
            icon="📈"
          />
          <StatCard
            label="Peak Forecast Day"
            value={maxForecast !== null ? maxForecast.toLocaleString() : "—"}
            sub="predicted new cases peak"
            color="amber"
            icon="⚡"
          />
        </section>

        {/* ── Map + Sidebar ── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5" style={{ minHeight: "440px" }}>
          {/* Map */}
          <div className="glass border border-[var(--border)] rounded-2xl overflow-hidden relative" style={{ minHeight: "440px" }}>
            {/* Map header */}
            <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-5 pt-4">
              <div className="glass border border-[var(--border)] px-4 py-2 rounded-xl">
                <p className="text-xs font-semibold text-[var(--text-primary)]">🗺️ Global COVID Heatmap</p>
                <p className="text-[10px] text-[var(--text-muted)]">Click a region to forecast</p>
              </div>
              {heatLoading && (
                <div className="glass border border-[var(--border)] px-3 py-2 rounded-xl flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs text-[var(--text-muted)]">Seeding map…</span>
                </div>
              )}
            </div>
            <CovidMap
              points={heatPoints}
              selectedRegion={selectedRegion}
              onRegionClick={handleRegionClick}
            />
          </div>

          {/* Sidebar */}
          <MapSidebar
            regions={regions}
            selectedRegion={selectedRegion}
            horizon={horizon}
            onRegionChange={setSelectedRegion}
            onHorizonChange={setHorizon}
            onFetch={runForecast}
            forecast={forecast}
            loading={forecastLoading}
            error={forecastError}
            heatPoints={heatPoints}
          />
        </section>

        {/* ── Forecast chart ── */}
        {forecast && (
          <section className="slide-up">
            <ForecastChart forecast={forecast} />
          </section>
        )}

        {/* ── Empty state ── */}
        {!forecast && !forecastLoading && apiStatus === "ok" && (
          <section className="glass border border-[var(--border)] rounded-2xl p-10 flex flex-col items-center gap-4 text-center slide-up">
            <div className="text-5xl">📊</div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No Forecast Yet</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Select a region from the sidebar, set your horizon, and click <strong className="text-blue-400">Run Forecast</strong> to visualize the prediction.
            </p>
          </section>
        )}

        {/* ── Error state ── */}
        {apiStatus === "error" && (
          <section className="glass border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">⚠️</div>
            <h3 className="text-lg font-bold text-red-400">Cannot reach backend</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Make sure the FastAPI server is running at{" "}
              <code className="text-cyan-400 bg-[var(--bg-primary)] px-2 py-0.5 rounded">
                http://localhost:8080
              </code>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-semibold hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-4 px-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          CodeCure COVID-19 Dashboard · AI-Powered Forecasting · Data for research purposes only
        </p>
      </footer>
    </div>
  );
}
