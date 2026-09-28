"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { PublicDistribution } from "@/lib/db/queries/publicStats";
import type { MapPin } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full animate-pulse rounded bg-neutral-100" />,
});

type ViewState =
  | { level: "world" }
  | { level: "country"; code: string; name: string }
  | { level: "province"; code: string; name: string; countryCode: string; countryName: string };

interface Row {
  key: string;
  label: string;
  count: number;
  lat: number | null;
  lng: number | null;
  clickable: boolean;
}

// Drill-down map (PRD 7.3/7.4/Journey A): World shows one aggregate per
// country; selecting a country shows its regions (only Indonesia has
// province/city data seeded so far — other countries show their total with
// no further breakdown yet); selecting a province shows its cities, with
// small-city groups folded into an unnamed "Other cities" bucket per the
// suppression threshold. Never more than one level's granularity on screen
// at once, per spec.
export function MapExplorer({ distribution }: { distribution: PublicDistribution }) {
  const [view, setView] = useState<ViewState>({ level: "world" });

  const rows: Row[] = useMemo(() => {
    if (view.level === "world") {
      return distribution.countries.map((c) => ({
        key: c.code,
        label: c.name,
        count: c.count,
        lat: c.lat,
        lng: c.lng,
        clickable: true,
      }));
    }

    if (view.level === "country") {
      if (view.code !== "ID") return [];
      return distribution.indonesiaProvinces.map((p) => ({
        key: p.code,
        label: p.name,
        count: p.count,
        lat: p.lat,
        lng: p.lng,
        clickable: true,
      }));
    }

    const province = distribution.indonesiaProvinces.find((p) => p.code === view.code);
    if (!province) return [];
    const cityRows: Row[] = province.cities.map((c) => ({
      key: c.code,
      label: c.name,
      count: c.count,
      lat: c.lat,
      lng: c.lng,
      clickable: false,
    }));
    if (province.suppressedCityCount > 0) {
      cityRows.push({
        key: "__other__",
        label: "Other cities (below reporting threshold)",
        count: province.suppressedCityCount,
        lat: province.lat,
        lng: province.lng,
        clickable: false,
      });
    }
    return cityRows;
  }, [view, distribution]);

  const pins: MapPin[] = rows
    .filter((r): r is Row & { lat: number; lng: number } => r.lat !== null && r.lng !== null)
    .map((r) => ({ key: r.key, label: r.label, count: r.count, lat: r.lat, lng: r.lng, clickable: r.clickable }));

  function handlePinClick(key: string) {
    if (view.level === "world") {
      const country = distribution.countries.find((c) => c.code === key);
      if (country) setView({ level: "country", code: country.code, name: country.name });
    } else if (view.level === "country") {
      const province = distribution.indonesiaProvinces.find((p) => p.code === key);
      if (province) {
        setView({
          level: "province",
          code: province.code,
          name: province.name,
          countryCode: view.code,
          countryName: view.name,
        });
      }
    }
  }

  const currentTotal =
    view.level === "world"
      ? distribution.totalMembers
      : view.level === "country"
        ? (distribution.countries.find((c) => c.code === view.code)?.count ?? 0)
        : (distribution.indonesiaProvinces.find((p) => p.code === view.code)?.count ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <nav className="flex flex-wrap items-center gap-1 px-4 text-sm text-neutral-500">
        <button onClick={() => setView({ level: "world" })} className="underline hover:text-neutral-900">
          World
        </button>
        {view.level !== "world" && (
          <>
            <span>/</span>
            <button
              onClick={() => {
                const code = view.level === "country" ? view.code : view.countryCode;
                const name = view.level === "country" ? view.name : view.countryName;
                setView({ level: "country", code, name });
              }}
              className="underline hover:text-neutral-900"
              disabled={view.level === "country"}
            >
              {view.level === "country" ? view.name : view.countryName}
            </button>
          </>
        )}
        {view.level === "province" && (
          <>
            <span>/</span>
            <span className="text-neutral-900">{view.name}</span>
          </>
        )}
      </nav>

      <p className="px-4 text-sm text-neutral-500">
        {currentTotal} member{currentTotal === 1 ? "" : "s"}
        {view.level !== "world" && ` (${Math.round((currentTotal / distribution.totalMembers) * 100)}% of the community)`}
      </p>

      <LeafletMap
        key={view.level === "world" ? "world" : view.code}
        pins={pins}
        onPinClick={handlePinClick}
      />

      {rows.length === 0 && (
        <p className="px-4 text-sm text-neutral-400">
          No further breakdown is available for this location yet.
        </p>
      )}
    </div>
  );
}
