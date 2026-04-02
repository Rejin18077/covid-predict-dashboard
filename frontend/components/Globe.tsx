"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import GlobeGL from "react-globe.gl";
import { PandemicEvent } from "@/lib/pandemics";

type GlobePoint = {
  country: string;
  lat: number;
  lng: number;
  size: number;
  eventCount: number;
};

type GlobeFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
  };
};

type GlobeProps = {
  events: PandemicEvent[];
  selectedCountry: string | null;
  onCountrySelect: (country: string) => void;
};

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Afghanistan: { lat: 33.9391, lng: 67.71 },
  Algeria: { lat: 28.0339, lng: 1.6596 },
  Angola: { lat: -11.2027, lng: 17.8739 },
  Argentina: { lat: -38.4161, lng: -63.6167 },
  Australia: { lat: -25.2744, lng: 133.7751 },
  Austria: { lat: 47.5162, lng: 14.5501 },
  Bangladesh: { lat: 23.685, lng: 90.3563 },
  Belgium: { lat: 50.5039, lng: 4.4699 },
  Bolivia: { lat: -16.2902, lng: -63.5887 },
  Brazil: { lat: -14.235, lng: -51.9253 },
  Cambodia: { lat: 12.5657, lng: 104.991 },
  Cameroon: { lat: 7.3697, lng: 12.3547 },
  Canada: { lat: 56.1304, lng: -106.3468 },
  Chile: { lat: -35.6751, lng: -71.543 },
  China: { lat: 35.8617, lng: 104.1954 },
  Colombia: { lat: 4.5709, lng: -74.2973 },
  Cuba: { lat: 21.5218, lng: -77.7812 },
  "Democratic Republic of the Congo": { lat: -4.0383, lng: 21.7587 },
  "Dominican Republic": { lat: 18.7357, lng: -70.1627 },
  Ecuador: { lat: -1.8312, lng: -78.1834 },
  Egypt: { lat: 26.8206, lng: 30.8025 },
  Ethiopia: { lat: 9.145, lng: 40.4897 },
  Fiji: { lat: -17.7134, lng: 178.065 },
  France: { lat: 46.2276, lng: 2.2137 },
  Germany: { lat: 51.1657, lng: 10.4515 },
  Ghana: { lat: 7.9465, lng: -1.0232 },
  Greece: { lat: 39.0742, lng: 21.8243 },
  Guinea: { lat: 9.9456, lng: -9.6966 },
  Haiti: { lat: 18.9712, lng: -72.2852 },
  India: { lat: 20.5937, lng: 78.9629 },
  Indonesia: { lat: -0.7893, lng: 113.9213 },
  Iran: { lat: 32.4279, lng: 53.688 },
  Iraq: { lat: 33.2232, lng: 43.6793 },
  Ireland: { lat: 53.1424, lng: -7.6921 },
  Israel: { lat: 31.0461, lng: 34.8516 },
  Italy: { lat: 41.8719, lng: 12.5674 },
  Jamaica: { lat: 18.1096, lng: -77.2975 },
  Japan: { lat: 36.2048, lng: 138.2529 },
  Kenya: { lat: -0.0236, lng: 37.9062 },
  Libya: { lat: 26.3351, lng: 17.2283 },
  Madagascar: { lat: -18.7669, lng: 46.8691 },
  Malaysia: { lat: 4.2105, lng: 101.9758 },
  Malta: { lat: 35.9375, lng: 14.3754 },
  Mexico: { lat: 23.6345, lng: -102.5528 },
  Morocco: { lat: 31.7917, lng: -7.0926 },
  Myanmar: { lat: 21.9162, lng: 95.956 },
  Nepal: { lat: 28.3949, lng: 84.124 },
  Netherlands: { lat: 52.1326, lng: 5.2913 },
  "New Zealand": { lat: -40.9006, lng: 174.886 },
  Nigeria: { lat: 9.082, lng: 8.6753 },
  Norway: { lat: 60.472, lng: 8.4689 },
  Pakistan: { lat: 30.3753, lng: 69.3451 },
  Panama: { lat: 8.538, lng: -80.7821 },
  Peru: { lat: -9.19, lng: -75.0152 },
  Philippines: { lat: 12.8797, lng: 121.774 },
  Poland: { lat: 51.9194, lng: 19.1451 },
  Portugal: { lat: 39.3999, lng: -8.2245 },
  Romania: { lat: 45.9432, lng: 24.9668 },
  Russia: { lat: 61.524, lng: 105.3188 },
  Rwanda: { lat: -1.9403, lng: 29.8739 },
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792 },
  Senegal: { lat: 14.4974, lng: -14.4524 },
  "Sierra Leone": { lat: 8.4606, lng: -11.7799 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Somalia: { lat: 5.1521, lng: 46.1996 },
  "South Africa": { lat: -30.5595, lng: 22.9375 },
  "South Korea": { lat: 35.9078, lng: 127.7669 },
  Spain: { lat: 40.4637, lng: -3.7492 },
  "Sri Lanka": { lat: 7.8731, lng: 80.7718 },
  Sudan: { lat: 12.8628, lng: 30.2176 },
  Sweden: { lat: 60.1282, lng: 18.6435 },
  Switzerland: { lat: 46.8182, lng: 8.2275 },
  Syria: { lat: 34.8021, lng: 38.9968 },
  Tanzania: { lat: -6.369, lng: 34.8888 },
  Thailand: { lat: 15.87, lng: 100.9925 },
  Tunisia: { lat: 33.8869, lng: 9.5375 },
  Turkey: { lat: 38.9637, lng: 35.2433 },
  Uganda: { lat: 1.3733, lng: 32.2903 },
  Ukraine: { lat: 48.3794, lng: 31.1656 },
  "United Kingdom": { lat: 55.3781, lng: -3.436 },
  "United States": { lat: 37.0902, lng: -95.7129 },
  Venezuela: { lat: 6.4238, lng: -66.5897 },
  Vietnam: { lat: 14.0583, lng: 108.2772 },
  Yemen: { lat: 15.5527, lng: 48.5164 },
  Zambia: { lat: -13.1339, lng: 27.8493 },
  Zimbabwe: { lat: -19.0154, lng: 29.1549 }
};

export default function Globe({
  events,
  selectedCountry,
  onCountrySelect
}: GlobeProps) {
  const globeRef = useRef<any>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [countryPolygons, setCountryPolygons] = useState<GlobeFeature[]>([]);

  const points = useMemo<GlobePoint[]>(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      event.countries.forEach((country) => {
        if (country === "Global" || !COUNTRY_COORDINATES[country]) return;
        counts.set(country, (counts.get(country) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries()).map(([country, eventCount]) => ({
      country,
      eventCount,
      lat: COUNTRY_COORDINATES[country].lat,
      lng: COUNTRY_COORDINATES[country].lng,
      size: Math.min(0.6, 0.15 + eventCount / 16)
    }));
  }, [events]);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCountryPolygons() {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
        );
        const data = await response.json();

        if (!cancelled) {
          setCountryPolygons(data.features ?? []);
        }
      } catch {
        if (!cancelled) {
          setCountryPolygons([]);
        }
      }
    }

    void loadCountryPolygons();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCountry || !COUNTRY_COORDINATES[selectedCountry]) return;

    const coordinates = COUNTRY_COORDINATES[selectedCountry];
    globeRef.current?.pointOfView(
      { lat: coordinates.lat, lng: coordinates.lng, altitude: 1.5 },
      900
    );
  }, [selectedCountry]);

  return (
    <div className="glass-panel rounded-[32px] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Interactive Globe
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Geographic Pandemic Explorer
          </h2>
        </div>
        <p className="max-w-xl text-sm text-slate-300">
          Drag to rotate, scroll to zoom, and click a country marker to open its
          pandemic event panel.
        </p>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#020814]">
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-coral/10 to-transparent"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0.45 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
        <div className="h-[470px] w-full">
          <GlobeGL
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#7cc6fe"
            atmosphereAltitude={0.14}
            polygonsData={countryPolygons}
            polygonAltitude={(feature) => {
              const country = normalizePolygonCountry(getFeatureName(feature as GlobeFeature));
              if (country === selectedCountry) return 0.025;
              if (country === hoveredCountry) return 0.018;
              return 0.01;
            }}
            polygonCapColor={(feature) => {
              const country = normalizePolygonCountry(getFeatureName(feature as GlobeFeature));
              const hasEvents = events.some((event) => event.countries.includes(country));
              if (country === selectedCountry) return "rgba(255,122,89,0.82)";
              if (country === hoveredCountry) return "rgba(255,209,102,0.65)";
              if (hasEvents) return "rgba(102,217,194,0.28)";
              return "rgba(255,255,255,0.06)";
            }}
            polygonSideColor={() => "rgba(124,198,254,0.08)"}
            polygonStrokeColor={() => "rgba(255,255,255,0.16)"}
            polygonLabel={(feature) => {
              const country = normalizePolygonCountry(getFeatureName(feature as GlobeFeature));
              const eventCount = events.filter((event) =>
                event.countries.includes(country)
              ).length;

              return `${country}<br/>${eventCount} mapped events`;
            }}
            onPolygonHover={(feature) =>
              setHoveredCountry(
                feature
                  ? normalizePolygonCountry(getFeatureName(feature as GlobeFeature))
                  : null
              )
            }
            onPolygonClick={(feature) =>
              onCountrySelect(
                normalizePolygonCountry(getFeatureName(feature as GlobeFeature))
              )
            }
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointAltitude="size"
            pointRadius={0.45}
            pointColor={(point) => {
              const current = point as GlobePoint;
              if (current.country === selectedCountry) return "#ff7a59";
              if (current.country === hoveredCountry) return "#ffd166";
              return "#66d9c2";
            }}
            pointLabel={(point) => {
              const current = point as GlobePoint;
              return `${current.country}<br/>${current.eventCount} events`;
            }}
            onPointHover={(point) =>
              setHoveredCountry(point ? (point as GlobePoint).country : null)
            }
            onPointClick={(point) => onCountrySelect((point as GlobePoint).country)}
            ringsData={points.filter(
              (point) =>
                point.country === selectedCountry || point.country === hoveredCountry
            )}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => ["rgba(255,122,89,0.65)", "rgba(255,122,89,0.04)"]}
            ringMaxRadius={4}
            ringPropagationSpeed={1.8}
            ringRepeatPeriod={900}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mapped Countries</p>
          <p className="mt-2 text-2xl font-semibold text-white">{points.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visible Events</p>
          <p className="mt-2 text-2xl font-semibold text-white">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Focused Country</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {selectedCountry ?? hoveredCountry ?? "Hover or select a country"}
          </p>
        </div>
      </div>
    </div>
  );
}

function getFeatureName(feature: GlobeFeature) {
  return feature.properties?.name ?? feature.properties?.ADMIN ?? "Unknown";
}

function normalizePolygonCountry(country: string) {
  const aliases: Record<string, string> = {
    "United States of America": "United States",
    "Democratic Republic of the Congo": "Democratic Republic of the Congo",
    "Republic of the Congo": "Democratic Republic of the Congo",
    "Czech Republic": "Czechia",
    England: "United Kingdom"
  };

  return aliases[country] ?? country;
}
