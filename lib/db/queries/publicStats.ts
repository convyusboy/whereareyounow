import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CityBreakdown {
  code: string;
  name: string;
  count: number;
  lat: number | null;
  lng: number | null;
}

export interface ProvinceBreakdown {
  code: string;
  name: string;
  count: number;
  cities: CityBreakdown[];
  suppressedCityCount: number; // members in cities below the threshold, grouped so no single small city is named
  lat: number | null;
  lng: number | null;
}

export interface CountryBreakdown {
  code: string;
  name: string;
  count: number;
  lat: number | null;
  lng: number | null;
}

export interface PublicDistribution {
  totalMembers: number;
  countries: CountryBreakdown[];
  indonesiaProvinces: ProvinceBreakdown[];
}

interface LocationRow {
  country_code: string;
  country_name: string;
  province_code: string | null;
  province_name: string | null;
  city_code: string | null;
  city_name: string | null;
}

// Public aggregate distribution (PRD 7.2/16: counts only, by country then
// Indonesia province/city — never names or any other member detail). Cities
// with fewer members than the community's public_suppression_threshold are
// folded into a single unnamed bucket per province, so no single small town
// can be tied to one person from the count alone.
export async function getPublicDistribution(communitySlug: string): Promise<PublicDistribution> {
  const supabase = createAdminClient();

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, privacy_config")
    .eq("slug", communitySlug)
    .single();
  if (communityError) throw communityError;

  const threshold =
    ((community.privacy_config as Record<string, unknown> | null)
      ?.public_suppression_threshold as number | undefined) ?? 5;

  const { data: rows, error } = await supabase
    .from("member_locations")
    .select(
      "locations(country_code, country_name, province_code, province_name, city_code, city_name), community_memberships!inner(status, community_id)"
    )
    .eq("is_current", true)
    .eq("community_memberships.status", "approved")
    .eq("community_memberships.community_id", community.id);
  if (error) throw error;

  const locations = (rows ?? [])
    .map((r) => r.locations as unknown as LocationRow | null)
    .filter((l): l is LocationRow => l !== null);

  const { data: coordRows, error: coordError } = await supabase
    .from("locations")
    .select("country_code, province_code, city_code, latitude, longitude")
    .not("latitude", "is", null);
  if (coordError) throw coordError;

  const countryCoords = new Map<string, [number, number]>();
  const provinceCoords = new Map<string, [number, number]>();
  const cityCoords = new Map<string, [number, number]>();
  for (const row of coordRows ?? []) {
    if (row.latitude === null || row.longitude === null) continue;
    const coord: [number, number] = [row.latitude, row.longitude];
    if (row.city_code) cityCoords.set(row.city_code, coord);
    else if (row.province_code) provinceCoords.set(row.province_code, coord);
    else countryCoords.set(row.country_code, coord);
  }

  function resolveCoords(
    countryCode: string,
    provinceCode?: string | null,
    cityCode?: string | null
  ): [number | null, number | null] {
    const match =
      (cityCode && cityCoords.get(cityCode)) ||
      (provinceCode && provinceCoords.get(provinceCode)) ||
      countryCoords.get(countryCode) ||
      null;
    return match ? [match[0], match[1]] : [null, null];
  }

  const countryCounts = new Map<string, CountryBreakdown>();
  const provinceCounts = new Map<string, ProvinceBreakdown>();

  for (const loc of locations) {
    const [countryLat, countryLng] = resolveCoords(loc.country_code);
    const countryEntry =
      countryCounts.get(loc.country_code) ??
      ({
        code: loc.country_code,
        name: loc.country_name,
        count: 0,
        lat: countryLat,
        lng: countryLng,
      } satisfies CountryBreakdown);
    countryEntry.count += 1;
    countryCounts.set(loc.country_code, countryEntry);

    if (loc.country_code === "ID" && loc.province_code) {
      const [provinceLat, provinceLng] = resolveCoords("ID", loc.province_code);
      const provinceEntry =
        provinceCounts.get(loc.province_code) ??
        ({
          code: loc.province_code,
          name: loc.province_name ?? loc.province_code,
          count: 0,
          cities: [],
          suppressedCityCount: 0,
          lat: provinceLat,
          lng: provinceLng,
        } satisfies ProvinceBreakdown);
      provinceEntry.count += 1;
      provinceCounts.set(loc.province_code, provinceEntry);
    }
  }

  // Tally cities per province separately, then decide what clears the threshold.
  const cityCountsByProvince = new Map<string, Map<string, string>>(); // province -> city_code -> city_name
  const cityTallies = new Map<string, number>(); // `${province_code}:${city_code}` -> count

  for (const loc of locations) {
    if (loc.country_code !== "ID" || !loc.province_code || !loc.city_code) continue;
    const key = `${loc.province_code}:${loc.city_code}`;
    cityTallies.set(key, (cityTallies.get(key) ?? 0) + 1);
    if (!cityCountsByProvince.has(loc.province_code)) {
      cityCountsByProvince.set(loc.province_code, new Map());
    }
    cityCountsByProvince.get(loc.province_code)!.set(loc.city_code, loc.city_name ?? loc.city_code);
  }

  for (const [provinceCode, cityNames] of cityCountsByProvince) {
    const province = provinceCounts.get(provinceCode);
    if (!province) continue;
    for (const [cityCode, cityName] of cityNames) {
      const count = cityTallies.get(`${provinceCode}:${cityCode}`) ?? 0;
      if (count >= threshold) {
        const [lat, lng] = resolveCoords("ID", provinceCode, cityCode);
        province.cities.push({ code: cityCode, name: cityName, count, lat, lng });
      } else {
        province.suppressedCityCount += count;
      }
    }
    province.cities.sort((a, b) => b.count - a.count);
  }

  return {
    totalMembers: locations.length,
    countries: [...countryCounts.values()].sort((a, b) => b.count - a.count),
    indonesiaProvinces: [...provinceCounts.values()].sort((a, b) => b.count - a.count),
  };
}
