"use client";

import "leaflet/dist/leaflet.css";
import type { FitBoundsOptions, LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

const FIT_BOUNDS_OPTIONS: FitBoundsOptions = { padding: [40, 40], maxZoom: 11 };

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
  const bounds: LatLngBoundsExpression =
    pins.length > 0
      ? pins.map((pin): [number, number] => [pin.lat, pin.lng])
      : [
          [-11, 95],
          [6, 141],
        ]; // fallback: roughly Indonesia's extent

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={FIT_BOUNDS_OPTIONS}
      scrollWheelZoom={true}
      style={{ height: "calc(100dvh - 180px)", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ResetViewControl bounds={bounds} />
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
