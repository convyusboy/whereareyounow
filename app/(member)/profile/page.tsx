import { redirect } from "next/navigation";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const STATUS_MESSAGE: Record<string, string> = {
  pending: "Your account is awaiting admin approval. You'll be notified once it's reviewed.",
  suspended: "Your account has been suspended. Contact an admin if you think this is a mistake.",
  rejected: "Your account request was not approved.",
  deleted: "This account has been removed.",
};

export default async function ProfilePage() {
  const membership = await requireMember(DEFAULT_COMMUNITY_SLUG);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("membership_id", membership.id)
    .maybeSingle();

  if (!profile?.profile_completed_at) {
    redirect("/onboarding");
  }

  if (membership.status !== "approved") {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {STATUS_MESSAGE[membership.status] ?? "Your account status doesn't allow access yet."}
      </div>
    );
  }

  const { data: location } = await supabase
    .from("member_locations")
    .select("effective_from, locations(country_name, province_name, city_name)")
    .eq("membership_id", membership.id)
    .eq("is_current", true)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">My profile</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-neutral-500">Name</dt>
        <dd>{profile.display_name}</dd>
        {profile.occupation && (
          <>
            <dt className="text-neutral-500">Occupation</dt>
            <dd>{profile.occupation}</dd>
          </>
        )}
        {profile.company_or_industry && (
          <>
            <dt className="text-neutral-500">Company / industry</dt>
            <dd>{profile.company_or_industry}</dd>
          </>
        )}
        {location?.locations && (
          <>
            <dt className="text-neutral-500">Location</dt>
            <dd>
              {[
                location.locations.city_name,
                location.locations.province_name,
                location.locations.country_name,
              ]
                .filter(Boolean)
                .join(", ")}
            </dd>
          </>
        )}
        {profile.bio && (
          <>
            <dt className="text-neutral-500">Bio</dt>
            <dd>{profile.bio}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
