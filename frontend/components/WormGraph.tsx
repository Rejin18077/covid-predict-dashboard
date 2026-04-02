"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  PandemicEvent,
  formatDeathToll,
  formatYear,
  getCountryEvents,
  getPrimaryDeathToll
} from "@/lib/pandemics";

type WormGraphProps = {
  events: PandemicEvent[];
  selectedCountries: string[];
  visibleUntilYear: number;
};

const LINE_COLORS = [
  "#66d9c2",
  "#ff7a59",
  "#ffd166",
  "#7cc6fe",
  "#ff9cc2",
  "#a78bfa",
  "#34d399"
];

type ChartRow = {
  year: number;
  yearLabel: string;
  [country: string]: string | number | null;
};

export default function WormGraph({
  events,
  selectedCountries,
  visibleUntilYear
}: WormGraphProps) {
  const activeCountries = selectedCountries.slice(0, 7);
  const rows = buildChartRows(events, activeCountries, visibleUntilYear);

  return (
    <div className="glass-panel rounded-[32px] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Multi-Country Worm Graph
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Death Toll Through Time
          </h2>
        </div>
        <p className="max-w-xl text-sm text-slate-300">
          Each line tracks event peaks for the selected countries. Hover any point to
          inspect the event, disease, date, and recorded death toll.
        </p>
      </div>

      <div className="mt-6 h-[380px] w-full">
        {activeCountries.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/5 text-center text-sm text-slate-400">
            Select at least one country to render the historical worm graph.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 18, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.09)" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={formatYear}
                stroke="#9fb1d1"
                tick={{ fontSize: 12 }}
                domain={["dataMin", "dataMax"]}
                type="number"
              />
              <YAxis
                stroke="#9fb1d1"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatDeathToll(Number(value))}
              />
              <Tooltip content={<CustomTooltip events={events} />} />
              <Legend />
              {activeCountries.map((country, index) => (
                <Line
                  key={country}
                  type="monotone"
                  dataKey={country}
                  name={country}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                  animationDuration={1000}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function buildChartRows(
  events: PandemicEvent[],
  countries: string[],
  visibleUntilYear: number
) {
  const rowsMap = new Map<number, ChartRow>();

  countries.forEach((country) => {
    const countryEvents = getCountryEvents(events, country).filter(
      (event) => event.startYear <= visibleUntilYear
    );

    countryEvents.forEach((event) => {
      const year = event.startYear;
      const existing = rowsMap.get(year) ?? {
        year,
        yearLabel: formatYear(year)
      };

      existing[country] = getPrimaryDeathToll(event);
      rowsMap.set(year, existing);
    });
  });

  return Array.from(rowsMap.values()).sort((a, b) => a.year - b.year);
}

type TooltipEntry = {
  dataKey: string;
  value: number | null;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: number;
  events: PandemicEvent[];
};

function CustomTooltip({
  active,
  payload,
  label,
  events
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const visiblePoint = payload.find((entry) => entry.value !== null);
  if (!visiblePoint) return null;

  const country = visiblePoint.dataKey;
  const event = events.find(
    (item: PandemicEvent) =>
      item.startYear === label && item.countries.includes(country)
  );

  if (!event) return null;

  return (
    <div className="rounded-3xl border border-white/12 bg-slate-950/95 p-4 text-sm shadow-2xl">
      <p className="font-medium text-white">Country: {country}</p>
      <p className="mt-2 text-slate-200">Event: {event.event}</p>
      <p className="text-slate-300">Date: {event.date}</p>
      <p className="text-slate-300">Deaths: {event.death_toll}</p>
      <p className="text-slate-300">Disease: {event.disease}</p>
    </div>
  );
}
