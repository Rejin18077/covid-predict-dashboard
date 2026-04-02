"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "red" | "cyan" | "amber" | "green" | "violet";
  icon?: React.ReactNode;
  pulse?: boolean;
}

const COLOR_MAP = {
  blue:   { text: "text-blue-400",   border: "border-blue-500/30",  bg: "bg-blue-500/10",   glow: "shadow-blue-500/20"  },
  red:    { text: "text-red-400",    border: "border-red-500/30",   bg: "bg-red-500/10",    glow: "shadow-red-500/20"   },
  cyan:   { text: "text-cyan-400",   border: "border-cyan-500/30",  bg: "bg-cyan-500/10",   glow: "shadow-cyan-500/20"  },
  amber:  { text: "text-amber-400",  border: "border-amber-500/30", bg: "bg-amber-500/10",  glow: "shadow-amber-500/20" },
  green:  { text: "text-green-400",  border: "border-green-500/30", bg: "bg-green-500/10",  glow: "shadow-green-500/20" },
  violet: { text: "text-violet-400", border: "border-violet-500/30",bg: "bg-violet-500/10", glow: "shadow-violet-500/20"},
};

export default function StatCard({ label, value, sub, color = "blue", icon, pulse }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div
      className={`
        glass glass-hover slide-up p-5 flex flex-col gap-2
        border ${c.border} shadow-lg ${c.glow}
        ${pulse ? "pulse-red" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </span>
        {icon && (
          <span className={`text-xl ${c.text} p-2 rounded-lg ${c.bg}`}>{icon}</span>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${c.text} text-glow-blue`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>
      )}
    </div>
  );
}
