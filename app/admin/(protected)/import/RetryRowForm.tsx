"use client";

import { useEffect, useState } from "react";
import type { RosterImportRowResult } from "@/lib/csv/rosterImport";

interface Option {
  id: string;
  code: string;
  name: string;
}

export function RetryRowForm({
  result,
  onResolved,
}: {
  result: RosterImportRowResult;
  onResolved: (updated: RosterImportRowResult) => void;
}) {
  const [countries, setCountries] = useState<Option[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [countryLocationId, setCountryLocationId] = useState("");
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [cities, setCities] = useState<Option[]>([]);
  const [cityLocationId, setCityLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/locations?level=country")
      .then((r) => r.json())
      .then(setCountries);
  }, []);

  useEffect(() => {
    if (countryCode === "ID") {
      fetch("/api/locations?level=province&country=ID")
        .then((r) => r.json())
        .then(setProvinces);
    }
  }, [countryCode]);

  useEffect(() => {
    if (provinceCode) {
      fetch(`/api/locations?level=city&province=${provinceCode}`)
        .then((r) => r.json())
        .then(setCities);
    }
  }, [provinceCode]);

  const isIndonesia = countryCode === "ID";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const locationId = isIndonesia ? cityLocationId : countryLocationId;
    if (!locationId || !result.rawRow) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/import/retry-row", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.rawRow, locationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create invitation");
        return;
      }
      onResolved({ ...result, status: "invited", rawCode: data.rawCode, detail: undefined });
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 py-2">
      <select
        value={countryLocationId}
        onChange={(e) => {
          setCountryLocationId(e.target.value);
          setCountryCode(e.target.selectedOptions[0]?.dataset.code ?? "");
          setProvinceCode("");
          setCityLocationId("");
        }}
        className="rounded border border-neutral-300 px-2 py-1 text-xs"
      >
        <option value="" disabled>
          Country…
        </option>
        {countries.map((c) => (
          <option key={c.id} value={c.id} data-code={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {isIndonesia && (
        <>
          <select
            value={provinceCode}
            onChange={(e) => {
              setProvinceCode(e.target.value);
              setCityLocationId("");
            }}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Province…
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={cityLocationId}
            onChange={(e) => setCityLocationId(e.target.value)}
            disabled={!provinceCode}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          >
            <option value="" disabled>
              City…
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        disabled={submitting || !(isIndonesia ? cityLocationId : countryLocationId)}
        className="rounded bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {submitting ? "…" : "Create invitation"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
