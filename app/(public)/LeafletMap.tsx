"use client";

import "leaflet/dist/leaflet.css";
import type { FitBoundsOptions, LatLngBoundsExpression } from "leaflet";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

const FIT_BOUNDS_OPTIONS: FitBoundsOptions = { padding: [40, 40], maxZoom: 11 };
const TILE_SIZE = 256;

// Re-fits and re-measures after a real window resize — react-leaflet doesn't
// pick up an external container resize on its own.
function InvalidateOnResize({ width, bounds }: { width: number; bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);
  return null;
}

// A plain, independently-positioned button rather than reusing Leaflet's
// internal `.leaflet-top`/`.leaflet-control` DOM — that DOM is owned and
// actively managed by Leaflet's own control-container lifecycle, and
// piggybacking a React-rendered div onto it intermittently lost the button
// (wrong stacking context, or Leaflet re-arranging that container's real
// children around it). This sits in ordinary CSS position:absolute over the
// map instead, fully independent of Leaflet's internals.
function ResetViewButton({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  return (
    <button
      type="button"
      title="Reset to fit view"
      onClick={() => map.fitBounds(bounds, FIT_BOUNDS_OPTIONS)}
      className="absolute right-2.5 top-2.5 z-[1000] rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium shadow-md hover:bg-neutral-50"
    >
      Center
    </button>
  );
}

export interface MapPin {
  key: string;
  label: string;
  count: number;
  lat: number;
  lng: number;
  clickable: boolean;
}

// Capped + gentler-than-linear scaling: an uncapped sqrt scale still let a
// high-count location (e.g. Indonesia, ~5x any other country's radius) grow
// large enough to swallow a geographically nearby small marker's clickable
// area, so clicks meant for the small one landed on the big one underneath
// instead — not a click-handling bug, a hit-area overlap problem.
function radiusFor(count: number): number {
  return Math.min(22, Math.max(8, Math.sqrt(count) * 3));
}

// Pure presentational Leaflet renderer — all drill-down state lives in
// MapExplorer. Dynamic-imported with ssr:false there, since Leaflet touches
// `window` at module load and can't be part of the server render.
export function LeafletMap({
  pins,
  onPinClick,
  isWorldLevel,
}: {
  pins: MapPin[];
  onPinClick: (key: string) => void;
  isWorldLevel: boolean;
}) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      setWidth(window.innerWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Neutral world extent, not any specific country/region — MapExplorer
  // should always supply at least a self-pin for whatever's being viewed
  // (see its hasBreakdown handling), but if pins is ever unexpectedly empty,
  // silently defaulting to one particular place's coordinates is exactly
  // the bug class that caused every non-Indonesia country to re-center on
  // Indonesia instead.
  const bounds: LatLngBoundsExpression =
    pins.length > 0
      ? pins.map((pin): [number, number] => [pin.lat, pin.lng])
      : [
          [-60, -180],
          [70, 180],
        ];

  if (width === null) {
    return <div style={{ height: "60vh", width: "100%" }} className="animate-pulse bg-neutral-100" />;
  }

  // Cap zoom-out at the level where a full 360° world is exactly as wide as
  // the viewport — applies at every drill level, so no view can ever tile
  // into repeated world copies.
  const minZoom = Math.max(1, Math.ceil(Math.log2(width / TILE_SIZE)));
  // The square (world-width == world-height) container only makes sense at
  // world level, to avoid empty side margins at max zoom-out. Forcing that
  // same huge height on a drilled-down (country/province) view served no
  // purpose — it's already zoomed into a small area — and left the map (and
  // the Center button pinned near its top) scrolled out of view if the page
  // had been scrolled down before drilling in.
  const height = isWorldLevel ? width : "calc(100dvh - 180px)";

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={FIT_BOUNDS_OPTIONS}
      scrollWheelZoom={true}
      minZoom={minZoom}
      maxBounds={[
        [-89, -180],
        [89, 180],
      ]}
      maxBoundsViscosity={1.0}
      style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />
      <ResetViewButton bounds={bounds} />
      <InvalidateOnResize width={width} bounds={bounds} />
      {pins.map((pin) => (
        <CircleMarker
          key={pin.key}
          center={[pin.lat, pin.lng]}
          radius={radiusFor(pin.count)}
          eventHandlers={pin.clickable ? { click: () => onPinClick(pin.key) } : undefined}
          pathOptions={{
            color: "#0f4c81",
            fillColor: "#0f4c81",
            fillOpacity: pin.clickable ? 0.5 : 0.3,
          }}
        >
          <Tooltip direction="top" offset={[0, -4]}>
            {pin.label}: {pin.count} member{pin.count === 1 ? "" : "s"}
          </Tooltip>
          <Popup>
            <strong>{pin.label}</strong>
            <br />
            {pin.count} member{pin.count === 1 ? "" : "s"}
            {pin.clickable && (
              <>
                <br />
                <button
                  onClick={() => onPinClick(pin.key)}
                  className="mt-1 text-xs underline"
                  type="button"
                >
                  View breakdown →
                </button>
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
