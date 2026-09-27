import { redirect } from "next/navigation";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileFormInitialValues } from "../../ProfileForm";

export default async function EditProfilePage() {
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

  const { data: location } = await supabase
    .from("member_locations")
    .select("effective_from, locations(country_code, province_code, city_code)")
    .eq("membership_id", membership.id)
    .eq("is_current", true)
    .maybeSingle();

  const visibility = (profile.visibility_config ?? {}) as ProfileFormInitialValues["visibility"];

  const initialValues: ProfileFormInitialValues = {
    displayName: profile.display_name,
    occupation: profile.occupation ?? "",
    companyOrIndustry: profile.company_or_industry ?? "",
    bio: profile.bio ?? "",
    education: profile.education ?? "",
    visibility,
    countryCode: location?.locations?.country_code ?? "",
    provinceCode: location?.locations?.province_code ?? "",
    cityCode: location?.locations?.city_code ?? "",
    effectiveFrom: location?.effective_from?.slice(0, 7) ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit profile</h1>
      <ProfileForm mode="edit" initialValues={initialValues} />
    </div>
  );
}
