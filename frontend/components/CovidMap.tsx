"use client";

import React, { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export interface HeatmapPoint {
  region: string;
  lat: number;
  lng: number;
  intensity: number; // 0-1 normalised
  rawCases: number;
}

interface CovidMapProps {
  points: HeatmapPoint[];
  selectedRegion: string | null;
  onRegionClick: (region: string) => void;
}

// Interpolate colour: cold (blue) → warm (yellow) → hot (red)
function heatColour(t: number): string {
  // t in [0,1]
  const r = Math.round(t < 0.5 ? 30 + t * 400 : 220 + (t - 0.5) * 60);
  const g = Math.round(t < 0.5 ? 60 + t * 180 : 180 - (t - 0.5) * 360);
  const b = Math.round(t < 0.5 ? 200 - t * 360 : 20);
  return `rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
}

export default function CovidMap({ points, selectedRegion, onRegionClick }: CovidMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Circle>>({});

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) return; // already initialised

      const map = L.map(containerRef.current!, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers whenever points change
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;

      // Remove old markers not in new set
      const newKeys = new Set(points.map((p) => p.region));
      Object.entries(markersRef.current).forEach(([key, circle]) => {
        if (!newKeys.has(key)) {
          circle.remove();
          delete markersRef.current[key];
        }
      });

      // Add / update markers
      points.forEach((pt) => {
        const color = heatColour(pt.intensity);
        const radius = 150_000 + pt.intensity * 900_000; // metres

        if (markersRef.current[pt.region]) {
          const circle = markersRef.current[pt.region];
          circle.setLatLng([pt.lat, pt.lng]);
          circle.setRadius(radius);
          circle.setStyle({ color, fillColor: color });
        } else {
          const circle = L.circle([pt.lat, pt.lng], {
            radius,
            color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 1.5,
            opacity: 0.7,
          }).addTo(map);

          circle.bindPopup(
            `<div style="min-width:160px">
              <p style="font-weight:700;font-size:14px;margin-bottom:6px;text-transform:capitalize">
                ${pt.region}
              </p>
              <p style="font-size:12px;color:#8ba3c7">Last known cases</p>
              <p style="font-size:18px;font-weight:700;color:${color}">
                ${pt.rawCases.toLocaleString()}
              </p>
              <p style="font-size:11px;color:#4a617f;margin-top:4px">Click to forecast →</p>
            </div>`,
            { maxWidth: 220 }
          );

          circle.on("click", () => {
            onRegionClick(pt.region);
          });

          markersRef.current[pt.region] = circle;
        }
      });
    });
  }, [points, onRegionClick]);

  // Fly to selected region
  useEffect(() => {
    if (!mapRef.current || !selectedRegion || typeof window === "undefined") return;
    const marker = markersRef.current[selectedRegion];
    if (marker) {
      const ll = marker.getLatLng();
      mapRef.current.flyTo(ll, 4, { duration: 1.2 });
      marker.openPopup();
    }
  }, [selectedRegion]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" id="covid-map" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass border border-[var(--border)] p-3 rounded-xl z-[1000]">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">
          Case Intensity
        </p>
        <div className="flex items-center gap-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
            <div
              key={t}
              className="w-6 h-3 rounded"
              style={{ background: heatColour(t) }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Point count badge */}
      {points.length > 0 && (
        <div className="absolute top-4 right-4 glass border border-[var(--border)] px-3 py-1.5 rounded-full z-[1000]">
          <p className="text-xs text-[var(--text-secondary)] font-semibold">
            🌍 {points.length} regions
          </p>
        </div>
      )}
    </div>
  );
}
