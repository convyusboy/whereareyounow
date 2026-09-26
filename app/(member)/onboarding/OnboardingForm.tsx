"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
  code: string;
  name: string;
}

export function OnboardingForm() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [companyOrIndustry, setCompanyOrIndustry] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");

  const [countries, setCountries] = useState<Option[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [cities, setCities] = useState<Option[]>([]);
  const [cityCode, setCityCode] = useState("");
  const [freeCity, setFreeCity] = useState("");

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

  function handleCountryChange(code: string) {
    setCountryCode(code);
    setProvinces([]);
    setProvinceCode("");
    setCities([]);
    setCityCode("");
  }

  function handleProvinceChange(code: string) {
    setProvinceCode(code);
    setCities([]);
    setCityCode("");
  }

  const isIndonesia = countryCode === "ID";
  const selectedCountry = countries.find((c) => c.code === countryCode);
  const selectedProvince = provinces.find((p) => p.code === provinceCode);
  const selectedCity = cities.find((c) => c.code === cityCode);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const profileRes = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          occupation: occupation || undefined,
          companyOrIndustry: companyOrIndustry || undefined,
          bio: bio || undefined,
          education: education || undefined,
        }),
      });
      if (!profileRes.ok) {
        const data = await profileRes.json().catch(() => ({}));
        throw new Error(data.error ? JSON.stringify(data.error) : "Could not save profile");
      }

      const locationRes = await fetch("/api/me/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryName: selectedCountry?.name,
          provinceName: isIndonesia ? selectedProvince?.name : undefined,
          cityName: isIndonesia ? selectedCity?.name : freeCity || undefined,
          effectiveFrom,
        }),
      });
      if (!locationRes.ok) {
        const data = await locationRes.json().catch(() => ({}));
        throw new Error(data.error ? JSON.stringify(data.error) : "Could not save location");
      }

      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="" disabled>
              Select…
            </option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
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
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">City</span>
            <select
              required
              value={cityCode}
              onChange={(e) => setCityCode(e.target.value)}
              disabled={!provinceCode}
              className="rounded border border-neutral-300 px-3 py-2"
            >
              <option value="" disabled>
                Select…
              </option>
              {cities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {countryCode && !isIndonesia && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">City (optional)</span>
          <input
            value={freeCity}
            onChange={(e) => setFreeCity(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
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

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Education / other affiliations (optional)</span>
        <input
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Short bio (optional)</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Submit for review"}
      </button>
    </form>
  );
}
