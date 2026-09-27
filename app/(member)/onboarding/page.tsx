import { redirect } from "next/navigation";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "../ProfileForm";

export default async function OnboardingPage() {
  const membership = await requireMember(DEFAULT_COMMUNITY_SLUG);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("member_profiles")
    .select("profile_completed_at")
    .eq("membership_id", membership.id)
    .maybeSingle();

  if (profile?.profile_completed_at) {
    redirect("/profile");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Complete your profile</h1>
        <p className="text-sm text-neutral-500">
          An admin will review your account before it appears to other members.
        </p>
      </div>
      <ProfileForm mode="create" />
    </div>
  );
}
