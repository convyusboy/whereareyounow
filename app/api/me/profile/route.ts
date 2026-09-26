import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMemberApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingProfileSchema } from "@/lib/validation/onboarding";

// Upsert semantics: this is both the initial onboarding profile creation and
// later "My Profile" edits (PRD 7.7), keyed by membership_id.
export async function PATCH(request: NextRequest) {
  const guard = await requireMemberApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = onboardingProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("member_profiles")
    .upsert(
      {
        membership_id: guard.membership.id,
        display_name: parsed.data.displayName,
        occupation: parsed.data.occupation,
        company_or_industry: parsed.data.companyOrIndustry,
        bio: parsed.data.bio,
        education: parsed.data.education,
        visibility_config: parsed.data.visibility,
        profile_completed_at: new Date().toISOString(),
      },
      { onConflict: "membership_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
