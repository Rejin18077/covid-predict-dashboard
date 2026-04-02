"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountryModal from "@/components/CountryModal";
import CountrySelector from "@/components/CountrySelector";
import pandemics from "@/data/pandemics.json";
import {
  PandemicEvent,
  getCountryEvents,
  uniqueCountries,
  uniqueDiseases
} from "@/lib/pandemics";

const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => <PanelSkeleton className="h-[620px]" />
});

const WormGraph = dynamic(() => import("@/components/WormGraph"), {
  ssr: false,
  loading: () => <PanelSkeleton className="h-[510px]" />
});

const events = pandemics as PandemicEvent[];
const MIN_YEAR = Math.min(...events.map((event) => event.startYear));
const MAX_YEAR = Math.max(...events.map((event) => event.endYear));
const MAX_DEATH_TOLL = Math.max(
  ...events.map((event) => event.deathTollMax ?? event.deathTollMin ?? 0)
);

export default function Page() {
  const countries = useMemo(() => uniqueCountries(events), []);
  const diseases = useMemo(() => uniqueDiseases(events), []);
  const defaultCountries = useMemo(() => pickDefaultCountries(events), []);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(defaultCountries);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    defaultCountries[0] ?? null
  );
  const [diseaseFilter, setDiseaseFilter] = useState("All diseases");
  const [deathFloor, setDeathFloor] = useState(0);
  const [visibleUntilYear, setVisibleUntilYear] = useState(MAX_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setVisibleUntilYear((current) => {
        if (current >= MAX_YEAR) {
          setIsPlaying(false);
          return MAX_YEAR;
        }

        return current + Math.max(1, Math.round((MAX_YEAR - MIN_YEAR) / 60));
      });
    }, 420);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const diseasePass =
        diseaseFilter === "All diseases" || event.disease === diseaseFilter;
      const deathPass = (event.deathTollMax ?? event.deathTollMin ?? 0) >= deathFloor;
      const timelinePass = event.startYear <= visibleUntilYear;

      return diseasePass && deathPass && timelinePass;
    });
  }, [deathFloor, diseaseFilter, visibleUntilYear]);

  const modalEvents = useMemo(() => {
    if (!selectedCountry) return [];
    return getCountryEvents(filteredEvents, selectedCountry);
  }, [filteredEvents, selectedCountry]);

  const metrics = useMemo(() => buildMetrics(filteredEvents), [filteredEvents]);

  const onCountrySelect = (country: string) => {
    setSelectedCountry(country);
    if (!selectedCountries.includes(country)) {
      setSelectedCountries((current) => [...current, country]);
    }
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-mesh px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="glass-panel overflow-hidden rounded-[36px] p-6 md:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-mint/70">
                Historical Pandemic Intelligence
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Explore how outbreaks moved across the world and through time.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                This dashboard turns your historical outbreak dataset into an
                interactive atlas with a movable globe, multi-country worm graph,
                timeline playback, and instant drill-down on major events.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{metric.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
                <CountrySelector
                  options={countries}
                  value={selectedCountries}
                  onChange={setSelectedCountries}
                />

                <label className="glass-panel rounded-2xl px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Disease Filter
                  </span>
                  <select
                    value={diseaseFilter}
                    onChange={(event) => setDiseaseFilter(event.target.value)}
                    className="mt-2 w-full bg-transparent text-sm text-white outline-none"
                  >
                    <option className="bg-slate-950" value="All diseases">
                      All diseases
                    </option>
                    {diseases.map((disease) => (
                      <option key={disease} className="bg-slate-950" value={disease}>
                        {disease}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="glass-panel rounded-2xl px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Death Toll Floor
                  </span>
                  <div className="mt-3 flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={MAX_DEATH_TOLL}
                      step={Math.max(1, Math.round(MAX_DEATH_TOLL / 200))}
                      value={deathFloor}
                      onChange={(event) => setDeathFloor(Number(event.target.value))}
                      className="w-full accent-coral"
                    />
                    <span className="min-w-20 text-right text-sm text-white">
                      {new Intl.NumberFormat("en-US", {
                        notation: deathFloor >= 1_000_000 ? "compact" : "standard",
                        maximumFractionDigits: 1
                      }).format(deathFloor)}
                    </span>
                  </div>
                </label>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Timeline Controller
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Reveal events up to{" "}
                      <span className="text-white">
                        {visibleUntilYear < 0
                          ? `${Math.abs(visibleUntilYear)} BC`
                          : visibleUntilYear}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibleUntilYear(MIN_YEAR)}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying((current) => !current)}
                      className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ff8b6f]"
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  step={1}
                  value={visibleUntilYear}
                  onChange={(event) => {
                    setIsPlaying(false);
                    setVisibleUntilYear(Number(event.target.value));
                  }}
                  className="mt-4 w-full accent-mint"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${diseaseFilter}-${deathFloor}-${visibleUntilYear}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Globe
                  events={filteredEvents}
                  selectedCountry={selectedCountry}
                  onCountrySelect={onCountrySelect}
                />
              </motion.div>
            </AnimatePresence>

            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[32px] p-5 md:p-6"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Selected Country Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {selectedCountry ?? "Choose a country"}
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Click any country marker on the globe to open the full scrollable
                event list. This side panel keeps the latest selection visible.
              </p>

              <div className="mt-6 space-y-3">
                {modalEvents.slice(0, 4).map((event) => (
                  <article
                    key={event.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-medium text-white">{event.event}</p>
                    <p className="mt-2 text-sm text-slate-300">{event.date}</p>
                    <p className="mt-1 text-sm text-slate-300">{event.disease}</p>
                    <p className="mt-1 text-sm text-slate-200">{event.death_toll}</p>
                  </article>
                ))}
                {modalEvents.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/12 bg-white/5 p-6 text-sm text-slate-400">
                    No events match the current filter set for this country.
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <WormGraph
            events={filteredEvents}
            selectedCountries={selectedCountries}
            visibleUntilYear={visibleUntilYear}
          />
        </motion.section>
      </div>

      <CountryModal
        country={selectedCountry}
        events={modalEvents}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}

function PanelSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`glass-panel animate-pulse rounded-[32px] border border-white/10 bg-white/5 ${className}`}
    />
  );
}

function buildMetrics(events: PandemicEvent[]) {
  const countries = uniqueCountries(events);
  const topEvent = [...events].sort(
    (a, b) => (b.deathTollMax ?? 0) - (a.deathTollMax ?? 0)
  )[0];

  return [
    {
      label: "Total Events",
      value: events.length.toString(),
      description: "Historical outbreaks currently visible after timeline and filter cuts."
    },
    {
      label: "Country Coverage",
      value: countries.length.toString(),
      description: "Countries with at least one mapped outbreak in the normalized dataset."
    },
    {
      label: "Top Event",
      value: topEvent?.event ?? "Unknown",
      description: "Highest estimated death toll among the visible events."
    },
    {
      label: "Timeline Extent",
      value: `${Math.abs(MIN_YEAR)} BC - ${MAX_YEAR}`,
      description: "Historical range represented in the current dashboard dataset."
    }
  ];
}

function pickDefaultCountries(events: PandemicEvent[]) {
  const counts = new Map<string, number>();

  events.forEach((event) => {
    event.countries.forEach((country) => {
      if (country === "Global") return;
      counts.set(country, (counts.get(country) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([country]) => country);
}
