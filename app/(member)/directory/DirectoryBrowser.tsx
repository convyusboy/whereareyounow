"use client";

import { useEffect, useMemo, useState } from "react";

interface DirectoryMember {
  membershipId: string;
  displayName: string;
  occupation: string | null;
  companyOrIndustry: string | null;
  bio: string | null;
  education: string | null;
  location: { city: string | null; province: string | null; country: string } | null;
}

export function DirectoryBrowser() {
  const [members, setMembers] = useState<DirectoryMember[] | null>(null);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => r.json())
      .then(setMembers);
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    members?.forEach((m) => m.location && set.add(m.location.country));
    return [...set].sort();
  }, [members]);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (country && m.location?.country !== country) return false;
      if (!q) return true;
      return (
        m.displayName.toLowerCase().includes(q) ||
        m.occupation?.toLowerCase().includes(q) ||
        m.companyOrIndustry?.toLowerCase().includes(q) ||
        m.location?.city?.toLowerCase().includes(q) ||
        m.location?.province?.toLowerCase().includes(q)
      );
    });
  }, [members, search, country]);

  if (!members) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, occupation, city…"
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-neutral-400">
        {filtered.length} member{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="flex flex-col gap-3">
        {filtered.map((m) => (
          <div key={m.membershipId} className="rounded border border-neutral-200 p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{m.displayName}</span>
              {m.location && (
                <span className="text-sm text-neutral-500">
                  {[m.location.city, m.location.province, m.location.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
            {(m.occupation || m.companyOrIndustry) && (
              <p className="mt-1 text-sm text-neutral-600">
                {[m.occupation, m.companyOrIndustry].filter(Boolean).join(" · ")}
              </p>
            )}
            {m.education && <p className="mt-1 text-sm text-neutral-500">{m.education}</p>}
            {m.bio && <p className="mt-2 text-sm text-neutral-700">{m.bio}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-400">No members match that search.</p>
        )}
      </div>
    </div>
  );
}
