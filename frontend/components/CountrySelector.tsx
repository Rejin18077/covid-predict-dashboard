"use client";

import { useMemo, useState } from "react";

type CountrySelectorProps = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export default function CountrySelector({
  options,
  value,
  onChange
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }

    onChange([...value, option]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="glass-panel flex min-h-14 w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Compare Countries
          </p>
          <p className="mt-1 text-sm text-white">
            {value.length === 0
              ? "Select one or more countries"
              : `${value.length} selected`}
          </p>
        </div>
        <span className="text-xs text-slate-300">{open ? "Close" : "Open"}</span>
      </button>

      {open ? (
        <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 rounded-3xl p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search countries"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-mint/50"
          />

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredOptions.map((option) => {
              const selected = value.includes(option);
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                    selected
                      ? "border-mint/40 bg-mint/10 text-white"
                      : "border-white/8 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span>{option}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-mint"
                    checked={selected}
                    onChange={() => toggleOption(option)}
                  />
                </label>
              );
            })}
            {filteredOptions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                No countries match your search.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
