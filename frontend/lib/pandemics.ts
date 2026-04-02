export type PandemicEvent = {
  id: string;
  event: string;
  date: string;
  location: string;
  disease: string;
  death_toll: string;
  ref: string;
  startYear: number;
  endYear: number;
  deathTollMin: number | null;
  deathTollMax: number | null;
  countries: string[];
  isGlobal: boolean;
};

export function formatYear(value: number) {
  return value < 0 ? `${Math.abs(value)} BC` : `${value}`;
}

export function formatDeathToll(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function getPrimaryDeathToll(event: PandemicEvent) {
  return event.deathTollMax ?? event.deathTollMin ?? 0;
}

export function uniqueCountries(events: PandemicEvent[]) {
  return Array.from(
    new Set(
      events
        .flatMap((event) => event.countries)
        .filter((country) => country && country !== "Global")
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function uniqueDiseases(events: PandemicEvent[]) {
  return Array.from(new Set(events.map((event) => event.disease))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getCountryEvents(events: PandemicEvent[], country: string) {
  return events
    .filter((event) => event.countries.includes(country))
    .sort((a, b) => a.startYear - b.startYear);
}
