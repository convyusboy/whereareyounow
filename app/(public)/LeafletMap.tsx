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

// Leaflet's own zoom control sits top-left; this reuses its control chrome
// (leaflet-bar / leaflet-control) so "Center" looks native, just top-right.
function ResetViewControl({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <a
          href="#"
          role="button"
          title="Reset to fit view"
          onClick={(e) => {
            e.preventDefault();
            map.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
          }}
          className="flex !w-auto items-center px-2 text-xs font-medium leading-[26px] no-underline"
        >
          Center
        </a>
      </div>
    </div>
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

function radiusFor(count: number): number {
  return Math.max(7, Math.sqrt(count) * 6);
}

// Pure presentational Leaflet renderer — all drill-down state lives in
// MapExplorer. Dynamic-imported with ssr:false there, since Leaflet touches
// `window` at module load and can't be part of the server render.
export function LeafletMap({ pins, onPinClick }: { pins: MapPin[]; onPinClick: (key: string) => void }) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      setWidth(window.innerWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const bounds: LatLngBoundsExpression =
    pins.length > 0
      ? pins.map((pin): [number, number] => [pin.lat, pin.lng])
      : [
          [-11, 95],
          [6, 141],
        ]; // fallback: roughly Indonesia's extent

  if (width === null) {
    return <div style={{ height: "60vh", width: "100%" }} className="animate-pulse bg-neutral-100" />;
  }

  // Cap zoom-out at the level where a full 360° world is exactly as wide as
  // the viewport — no narrower (which would otherwise need repeated world
  // copies or empty side margins to fill the width). The world is square in
  // tile space, so at that zoom its height equals its width too; making the
  // container that tall (rather than a fixed viewport height) means a wide,
  // short viewport just scrolls vertically to see the rest, instead of
  // squeezing the map or leaving empty bars.
  const minZoom = Math.max(1, Math.ceil(Math.log2(width / TILE_SIZE)));
  const squareHeight = width;

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
      style={{ height: `${squareHeight}px`, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />
      <ResetViewControl bounds={bounds} />
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
