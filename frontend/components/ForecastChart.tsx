"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ForecastResponse } from "@/lib/api";

interface ForecastChartProps {
  forecast: ForecastResponse;
}

type ViewMode = "all" | "7" | "14" | "30";

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "All", value: "all" },
  { label: "7d", value: "7" },
  { label: "14d", value: "14" },
  { label: "30d", value: "30" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const cases = payload[0]?.value ?? 0;
  return (
    <div className="glass border border-[var(--border)] p-3 rounded-xl shadow-xl">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-lg font-bold text-cyan-400">{cases.toLocaleString()}</p>
      <p className="text-[10px] text-[var(--text-muted)]">predicted new cases</p>
    </div>
  );
}

export default function ForecastChart({ forecast }: ForecastChartProps) {
  const [view, setView] = useState<ViewMode>("all");

  const raw = forecast.forecast;
  const sliced =
    view === "all" ? raw : raw.slice(0, Number(view));

  const data = sliced.map((d) => ({
    date: formatDate(d.date),
    cases: d.predicted_new_cases,
  }));

  const maxCases = Math.max(...data.map((d) => d.cases), 1);
  const avgCases = Math.round(data.reduce((s, d) => s + d.cases, 0) / (data.length || 1));
  const totalCases = data.reduce((s, d) => s + d.cases, 0);
  const peakDay = data.reduce((a, b) => (a.cases > b.cases ? a : b));

  return (
    <div className="glass border border-[var(--border)] p-6 rounded-2xl slide-up flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] capitalize">
            {forecast.region} — Daily Case Forecast
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Starting from {formatDate(forecast.last_known_date)} · {forecast.horizon_days}-day window
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border)]">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`chart-view-${opt.value}`}
              onClick={() => setView(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                ${view === opt.value
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Last Known", value: forecast.last_known_cases.toLocaleString(), color: "text-amber-400" },
          { label: "Avg / Day", value: formatNumber(avgCases), color: "text-blue-400" },
          { label: "Peak Day", value: peakDay.date, color: "text-red-400" },
          { label: "Total Forecast", value: formatNumber(totalCases), color: "text-cyan-400" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3"
          >
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-lg font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#4a617f", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: "#4a617f", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgCases}
              stroke="#3b82f680"
              strokeDasharray="4 4"
              label={{ value: "avg", fill: "#3b82f6", fontSize: 10, position: "insideTopRight" }}
            />
            <Area
              type="monotone"
              dataKey="cases"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#forecastGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#06b6d4", stroke: "#0d1321", strokeWidth: 2 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-[var(--text-muted)] text-center">
        ⚠️ Predictions are model-generated estimates and should not be used for clinical decisions.
      </p>
    </div>
  );
}
