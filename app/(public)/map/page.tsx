import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { getPublicDistribution } from "@/lib/db/queries/publicStats";
import { MapLoader } from "./MapLoader";

export const dynamic = "force-dynamic";

// Public distribution view (PRD 7.2/16: counts only, by country then
// Indonesia province/city — never names or any other member detail). Only
// approved members' current locations are counted; cities below the
// community's suppression threshold are folded into an unnamed bucket per
// province rather than listed individually.
export default async function PublicMapPage() {
  const distribution = await getPublicDistribution(DEFAULT_COMMUNITY_SLUG);
  const indonesia = distribution.countries.find((c) => c.code === "ID");
  const otherCountries = distribution.countries.filter((c) => c.code !== "ID");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-neutral-400 underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Where is everyone now?</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {distribution.totalMembers} approved member{distribution.totalMembers === 1 ? "" : "s"}{" "}
        across {distribution.countries.length} countr
        {distribution.countries.length === 1 ? "y" : "ies"}.
      </p>

      {distribution.totalMembers > 0 && (
        <div className="mt-6">
          <MapLoader distribution={distribution} />
        </div>
      )}

      {distribution.totalMembers === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">No approved members yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {indonesia && (
            <section>
              <h2 className="mb-3 text-lg font-medium">
                Indonesia <span className="text-neutral-400">— {indonesia.count}</span>
              </h2>
              <div className="flex flex-col gap-4">
                {distribution.indonesiaProvinces.map((province) => (
                  <div key={province.code} className="rounded border border-neutral-200 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{province.name}</span>
                      <span className="text-sm text-neutral-500">{province.count}</span>
                    </div>
                    {(province.cities.length > 0 || province.suppressedCityCount > 0) && (
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
                        {province.cities.map((city) => (
                          <li key={city.name} className="flex items-baseline justify-between">
                            <span>{city.name}</span>
                            <span className="text-neutral-400">{city.count}</span>
                          </li>
                        ))}
                        {province.suppressedCityCount > 0 && (
                          <li className="flex items-baseline justify-between text-neutral-400">
                            <span>Other cities</span>
                            <span>{province.suppressedCityCount}</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {otherCountries.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Elsewhere</h2>
              <ul className="flex flex-col gap-2">
                {otherCountries.map((country) => (
                  <li
                    key={country.code}
                    className="flex items-baseline justify-between rounded border border-neutral-200 p-3"
                  >
                    <span className="font-medium">{country.name}</span>
                    <span className="text-sm text-neutral-500">{country.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
