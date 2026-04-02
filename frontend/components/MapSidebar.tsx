"use client";

import React from "react";
import type { ForecastResponse } from "@/lib/api";
import type { HeatmapPoint } from "./CovidMap";

interface MapSidebarProps {
  regions: string[];
  selectedRegion: string;
  horizon: number;
  onRegionChange: (r: string) => void;
  onHorizonChange: (h: number) => void;
  onFetch: () => void;
  forecast: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  heatPoints: HeatmapPoint[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export default function MapSidebar({
  regions,
  selectedRegion,
  horizon,
  onRegionChange,
  onHorizonChange,
  onFetch,
  forecast,
  loading,
  error,
  heatPoints,
}: MapSidebarProps) {
  // Peak from heatmap
  const peak = heatPoints.length
    ? heatPoints.reduce((a, b) => (a.intensity > b.intensity ? a : b))
    : null;

  return (
    <aside className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* ── Controls ── */}
      <div className="glass border border-[var(--border)] p-5 rounded-2xl slide-up">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Forecast Settings
        </h2>

        {/* Region select */}
        <label className="block mb-3">
          <span className="text-xs text-[var(--text-secondary)] mb-1 block">
            Region
          </span>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl
                       px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-blue-500
                       focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </label>

        {/* Horizon slider */}
        <label className="block mb-4">
          <span className="text-xs text-[var(--text-secondary)] mb-1 flex justify-between">
            <span>Forecast Horizon</span>
            <span className="text-blue-400 font-semibold">{horizon} days</span>
          </span>
          <input
            id="horizon-slider"
            type="range"
            min={7}
            max={60}
            step={1}
            value={horizon}
            onChange={(e) => onHorizonChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span>7d</span>
            <span>30d</span>
            <span>60d</span>
          </div>
        </label>

        <button
          id="fetch-forecast-btn"
          onClick={onFetch}
          disabled={loading || !selectedRegion}
          className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide
                     bg-gradient-to-r from-blue-600 to-cyan-600
                     hover:from-blue-500 hover:to-cyan-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-blue-500/20
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Forecasting…
            </>
          ) : (
            <>{/* icon */}⚡ Run Forecast</>
          )}
        </button>

        {error && (
          <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      {/* ── Global Summary ── */}
      {heatPoints.length > 0 && (
        <div className="glass border border-[var(--border)] p-5 rounded-2xl slide-up">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
            Global Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                Regions
              </p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {heatPoints.length}
              </p>
            </div>
            {peak && (
              <div className="bg-[var(--bg-primary)] rounded-xl p-3 border border-red-500/20">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                  Hottest
                </p>
                <p className="text-sm font-bold text-red-400 mt-1 truncate">
                  {peak.region.charAt(0).toUpperCase() + peak.region.slice(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Forecast Result ── */}
      {forecast && (
        <div className="glass border border-cyan-500/20 p-5 rounded-2xl slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Forecast Result
            </h2>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
              {forecast.horizon_days}d window
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Region</span>
              <span className="text-[var(--text-primary)] font-medium capitalize">
                {forecast.region}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Last Known Date</span>
              <span className="text-[var(--text-primary)] font-medium">
                {formatDate(forecast.last_known_date)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Last Known Cases</span>
              <span className="text-amber-400 font-bold">
                {formatNumber(forecast.last_known_cases)}
              </span>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wide">
              Forecast Preview
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {forecast.forecast.slice(0, 10).map((d, i) => {
                const maxCases = Math.max(
                  ...forecast.forecast.map((x) => x.predicted_new_cases),
                  1,
                );
                const pct = (d.predicted_new_cases / maxCases) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] w-14 shrink-0">
                      {formatDate(d.date)}
                    </span>
                    <div className="flex-1 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{
                          width: `${pct}%`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono w-14 text-right shrink-0">
                      {formatNumber(d.predicted_new_cases)}
                    </span>
                  </div>
                );
              })}
              {forecast.forecast.length > 10 && (
                <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
                  +{forecast.forecast.length - 10} more days in chart ↓
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
