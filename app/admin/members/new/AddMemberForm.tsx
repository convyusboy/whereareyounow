"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
  id: string;
  code: string;
  name: string;
}

export function AddMemberForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [companyOrIndustry, setCompanyOrIndustry] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");

  const [countries, setCountries] = useState<Option[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [countryLocationId, setCountryLocationId] = useState("");
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [cities, setCities] = useState<Option[]>([]);
  const [cityLocationId, setCityLocationId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/locations?level=country")
      .then((r) => r.json())
      .then(setCountries);
  }, []);

  useEffect(() => {
    if (countryCode === "ID") {
      fetch(`/api/locations?level=province&country=ID`)
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

  function handleCountryChange(locationId: string, code: string) {
    setCountryLocationId(locationId);
    setCountryCode(code);
    setProvinces([]);
    setProvinceCode("");
    setCities([]);
    setCityLocationId("");
  }

  function handleProvinceChange(code: string) {
    setProvinceCode(code);
    setCities([]);
    setCityLocationId("");
  }

  const isIndonesia = countryCode === "ID";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const locationId = isIndonesia ? cityLocationId : countryLocationId;

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          occupation: occupation || undefined,
          companyOrIndustry: companyOrIndustry || undefined,
          locationId,
          effectiveFrom,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create member");
        return;
      }
      router.push(`/admin/members/${data.id}`);
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Name</span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Country</span>
          <select
            required
            value={countryLocationId}
            onChange={(e) =>
              handleCountryChange(e.target.value, e.target.selectedOptions[0]?.dataset.code ?? "")
            }
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="" disabled>
              Select…
            </option>
            {countries.map((c) => (
              <option key={c.id} value={c.id} data-code={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Since (month)</span>
          <input
            type="month"
            required
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      {isIndonesia && (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Province</span>
            <select
              required
              value={provinceCode}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
            >
              <option value="" disabled>
                Select…
              </option>
              {provinces.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">City</span>
            <select
              required
              value={cityLocationId}
              onChange={(e) => setCityLocationId(e.target.value)}
              disabled={!provinceCode}
              className="rounded border border-neutral-300 px-3 py-2"
            >
              <option value="" disabled>
                Select…
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Occupation (optional)</span>
        <input
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Company / industry (optional)</span>
        <input
          value={companyOrIndustry}
          onChange={(e) => setCompanyOrIndustry(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create member"}
      </button>
    </form>
  );
}
