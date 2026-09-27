"use client";

import dynamic from "next/dynamic";
import type { PublicDistribution } from "@/lib/db/queries/publicStats";

// `ssr: false` requires a Client Component boundary — Leaflet touches
// `window` at module load, so it can't be part of the server render at all.
const InteractiveMap = dynamic(
  () => import("./InteractiveMap").then((mod) => mod.InteractiveMap),
  { ssr: false, loading: () => <div className="h-[500px] w-full animate-pulse rounded bg-neutral-100" /> }
);

export function MapLoader({ distribution }: { distribution: PublicDistribution }) {
  return <InteractiveMap distribution={distribution} />;
}
