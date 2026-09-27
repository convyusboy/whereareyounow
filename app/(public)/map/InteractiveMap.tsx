"use client";

import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { PublicDistribution } from "@/lib/db/queries/publicStats";

interface Pin {
  key: string;
  label: string;
  count: number;
  lat: number;
  lng: number;
}

function radiusFor(count: number): number {
  return Math.max(7, Math.sqrt(count) * 6);
}

export function InteractiveMap({ distribution }: { distribution: PublicDistribution }) {
  const pins: Pin[] = [];

  for (const province of distribution.indonesiaProvinces) {
    for (const city of province.cities) {
      if (city.lat === null || city.lng === null) continue;
      pins.push({
        key: `city-${city.code}`,
        label: city.name,
        count: city.count,
        lat: city.lat,
        lng: city.lng,
      });
    }
    if (province.suppressedCityCount > 0 && province.lat !== null && province.lng !== null) {
      pins.push({
        key: `province-other-${province.code}`,
        label: `Other cities in ${province.name}`,
        count: province.suppressedCityCount,
        lat: province.lat,
        lng: province.lng,
      });
    }
  }

  for (const country of distribution.countries) {
    if (country.code === "ID") continue;
    if (country.lat === null || country.lng === null) continue;
    pins.push({
      key: `country-${country.code}`,
      label: country.name,
      count: country.count,
      lat: country.lat,
      lng: country.lng,
    });
  }

  // Fit the view to wherever the pins actually are, rather than a fixed
  // center/zoom — a handful of members clustered in one part of the
  // country (or spread across continents) both need to stay fully visible.
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
      boundsOptions={{ padding: [40, 40] }}
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
          pathOptions={{ color: "#0f4c81", fillColor: "#0f4c81", fillOpacity: 0.5 }}
        >
          <Popup>
            <strong>{pin.label}</strong>
            <br />
            {pin.count} member{pin.count === 1 ? "" : "s"}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
