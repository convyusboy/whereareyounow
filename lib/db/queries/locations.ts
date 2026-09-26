import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface ResolveLocationInput {
  countryName: string;
  provinceName?: string;
  cityName?: string;
}

export interface ResolveLocationResult {
  locationId: string | null;
  matched: "city" | "province" | "country" | "created" | "none";
}

// Resolves free-text roster/onboarding location fields against the seeded
// `locations` table (PRD 7.10: Indonesia province/city combinations must be
// valid). Indonesia matches strictly against the seeded hierarchy; other
// countries fall back to creating an on-demand city-level row scoped to that
// country, since seeding every city on Earth isn't feasible in Phase 1 (see
// supabase/migrations/0003_seed_locations.sql).
export async function resolveLocation(
  input: ResolveLocationInput
): Promise<ResolveLocationResult> {
  const supabase = createAdminClient();
  const countryName = normalize(input.countryName);

  const { data: countryMatches, error: countryError } = await supabase
    .from("locations")
    .select("id, country_code, country_name")
    .ilike("country_name", countryName);
  if (countryError) throw countryError;

  const countryRow =
    countryMatches?.find((c) => normalize(c.country_name) === countryName) ?? countryMatches?.[0];

  if (!countryRow) {
    return { locationId: null, matched: "none" };
  }

  const isIndonesia = countryRow.country_code === "ID";

  if (!isIndonesia) {
    if (!input.cityName) {
      return { locationId: countryRow.id, matched: "country" };
    }
    return {
      locationId: await upsertNonIndonesiaCity(countryRow.country_code, input.cityName),
      matched: "created",
    };
  }

  // Indonesia: require a real province/city match against the seeded hierarchy.
  if (!input.provinceName) {
    return { locationId: countryRow.id, matched: "country" };
  }

  const provinceName = normalize(input.provinceName);
  const { data: provinceMatches, error: provinceError } = await supabase
    .from("locations")
    .select("id, province_code, province_name")
    .eq("country_code", "ID")
    .is("city_code", null)
    .not("province_code", "is", null)
    .ilike("province_name", `%${input.provinceName.trim()}%`);
  if (provinceError) throw provinceError;

  const provinceRow =
    provinceMatches?.find((p) => normalize(p.province_name ?? "") === provinceName) ??
    provinceMatches?.[0];

  if (!provinceRow) {
    return { locationId: null, matched: "none" };
  }

  if (!input.cityName) {
    return { locationId: provinceRow.id, matched: "province" };
  }

  const cityName = normalize(input.cityName);
  const { data: cityMatches, error: cityError } = await supabase
    .from("locations")
    .select("id, city_name")
    .eq("province_code", provinceRow.province_code)
    .not("city_code", "is", null)
    .ilike("city_name", `%${input.cityName.trim()}%`);
  if (cityError) throw cityError;

  const cityRow =
    cityMatches?.find((c) => normalize(c.city_name ?? "").includes(cityName)) ?? cityMatches?.[0];

  if (!cityRow) {
    return { locationId: provinceRow.id, matched: "province" };
  }

  return { locationId: cityRow.id, matched: "city" };
}

async function upsertNonIndonesiaCity(countryCode: string, cityName: string): Promise<string> {
  const supabase = createAdminClient();
  const cityCode = slugify(cityName);

  const { data: existing, error: lookupError } = await supabase
    .from("locations")
    .select("id")
    .eq("country_code", countryCode)
    .eq("city_code", cityCode)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id;

  const { data: country, error: countryError } = await supabase
    .from("locations")
    .select("country_name")
    .eq("country_code", countryCode)
    .is("city_code", null)
    .is("province_code", null)
    .single();
  if (countryError) throw countryError;

  const { data: created, error: insertError } = await supabase
    .from("locations")
    .insert({
      country_code: countryCode,
      country_name: country.country_name,
      city_code: cityCode,
      city_name: cityName.trim(),
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  return created.id;
}
