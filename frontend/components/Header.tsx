"use client";

import React from "react";

interface HeaderProps {
  apiStatus: "loading" | "ok" | "error";
  regionsCount: number;
}

export default function Header({ apiStatus, regionsCount }: HeaderProps) {
  const statusColor =
    apiStatus === "ok"    ? "text-green-400 bg-green-500/10 border-green-500/30" :
    apiStatus === "error" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                            "text-amber-400 bg-amber-500/10 border-amber-500/30";

  const statusLabel =
    apiStatus === "ok"    ? "API Connected" :
    apiStatus === "error" ? "API Offline" :
                            "Connecting…";

  const statusDot =
    apiStatus === "ok"    ? "bg-green-400" :
    apiStatus === "error" ? "bg-red-400" :
                            "bg-amber-400 animate-pulse";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">
          🦠
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            CodeCure
          </h1>
          <p className="text-[10px] text-[var(--text-muted)] -mt-0.5">COVID·19 Forecast Dashboard</p>
        </div>
      </div>

      {/* Centre nav */}
      <nav className="hidden md:flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-1">
        {["Dashboard", "Heatmap", "Forecast"].map((item, i) => (
          <button
            key={item}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${i === 0
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Status pills */}
      <div className="flex items-center gap-3">
        {regionsCount > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border)] px-3 py-1.5 rounded-full">
            🌍 <strong className="text-blue-400">{regionsCount}</strong> regions
          </span>
        )}
        <span className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full font-semibold ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {statusLabel}
        </span>
      </div>
    </header>
  );
}
