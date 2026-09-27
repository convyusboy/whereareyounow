import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FieldVisibility } from "@/lib/validation/onboarding";

export interface DirectoryMember {
  membershipId: string;
  displayName: string;
  occupation: string | null;
  companyOrIndustry: string | null;
  bio: string | null;
  education: string | null;
  location: { city: string | null; province: string | null; country: string } | null;
}

interface VisibilityConfig {
  occupation?: FieldVisibility;
  companyOrIndustry?: FieldVisibility;
  bio?: FieldVisibility;
  education?: FieldVisibility;
}

// Unspecified defaults to "members" (visible to fellow approved members) —
// only an explicit "admin_only" or "hidden" choice suppresses a field here.
// displayName and location have no visibility toggle: showing "who's a
// member and roughly where they live" is the directory's whole purpose.
function visibleTo(config: VisibilityConfig, field: keyof VisibilityConfig): boolean {
  const setting = config[field];
  return setting !== "admin_only" && setting !== "hidden";
}

export interface DirectorySearchOptions {
  search?: string;
  country?: string;
}

// Member-facing directory (PRD Phase 3: "member-level location panels,
// profiles and visibility controls, search and filters") — distinct from
// the public /map, which only ever shows aggregate counts. Only approved
// members should call this (enforced by the route, not here).
export async function getDirectoryMembers(
  communitySlug: string,
  options: DirectorySearchOptions = {}
): Promise<DirectoryMember[]> {
  const supabase = createAdminClient();

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", communitySlug)
    .single();
  if (communityError) throw communityError;

  let query = supabase
    .from("community_memberships")
    .select(
      "id, member_profiles(display_name, occupation, company_or_industry, bio, education, visibility_config), member_locations(is_current, locations(city_name, province_name, country_name))"
    )
    .eq("community_id", community.id)
    .eq("status", "approved");

  if (options.search) {
    query = query.ilike("member_profiles.display_name", `%${options.search}%`);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const members: DirectoryMember[] = [];

  for (const row of rows ?? []) {
    const profile = row.member_profiles as unknown as {
      display_name: string;
      occupation: string | null;
      company_or_industry: string | null;
      bio: string | null;
      education: string | null;
      visibility_config: VisibilityConfig | null;
    } | null;
    if (!profile) continue;

    const currentLocation = (
      row.member_locations as unknown as {
        is_current: boolean;
        locations: { city_name: string | null; province_name: string | null; country_name: string } | null;
      }[]
    )?.find((l) => l.is_current)?.locations;

    if (options.country && currentLocation?.country_name !== options.country) continue;

    const config = profile.visibility_config ?? {};

    members.push({
      membershipId: row.id,
      displayName: profile.display_name,
      occupation: visibleTo(config, "occupation") ? profile.occupation : null,
      companyOrIndustry: visibleTo(config, "companyOrIndustry") ? profile.company_or_industry : null,
      bio: visibleTo(config, "bio") ? profile.bio : null,
      education: visibleTo(config, "education") ? profile.education : null,
      location: currentLocation
        ? {
            city: currentLocation.city_name,
            province: currentLocation.province_name,
            country: currentLocation.country_name,
          }
        : null,
    });
  }

  return members.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
