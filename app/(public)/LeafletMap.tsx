"use client";

import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";

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
      boundsOptions={{ padding: [40, 40], maxZoom: 11 }}
      scrollWheelZoom={true}
      style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
