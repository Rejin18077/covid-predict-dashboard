"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PandemicEvent, formatYear } from "@/lib/pandemics";

type CountryModalProps = {
  country: string | null;
  events: PandemicEvent[];
  open: boolean;
  onClose: () => void;
};

export default function CountryModal({
  country,
  events,
  open,
  onClose
}: CountryModalProps) {
  return (
    <AnimatePresence>
      {open && country ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel flex h-[min(80vh,42rem)] w-full max-w-xl flex-col overflow-hidden rounded-[28px]"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-mint/70">
                    Country Focus
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {country}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {events.length} historical event{events.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {events.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  No mapped pandemic events were found for this country in the current
                  filters.
                </div>
              ) : null}

              {events.map((event) => (
                <motion.article
                  key={event.id}
                  layout
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-medium text-white">{event.event}</h3>
                    <span className="rounded-full bg-coral/15 px-3 py-1 text-xs text-coral">
                      {event.date}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-400">Location</dt>
                      <dd className="mt-1 text-slate-100">{event.location}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Disease</dt>
                      <dd className="mt-1 text-slate-100">{event.disease}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Timeline</dt>
                      <dd className="mt-1 text-slate-100">
                        {formatYear(event.startYear)}
                        {event.endYear !== event.startYear
                          ? ` to ${formatYear(event.endYear)}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Death Toll</dt>
                      <dd className="mt-1 text-slate-100">{event.death_toll}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Reference</dt>
                      <dd className="mt-1 break-words text-slate-100">{event.ref}</dd>
                    </div>
                  </dl>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
