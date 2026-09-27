import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/db/queries/audit";

const adminEditProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  occupation: z.string().trim().max(160).optional(),
  companyOrIndustry: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  education: z.string().trim().max(300).optional(),
});

// Admin correction path (PRD Phase 4: "reports and corrections") — bypasses
// the member's own visibility_config entirely, since admins can already see
// every field regardless; this only touches the underlying values. Every
// change is audited with before/after values, same as status changes.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const { membershipId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminEditProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: before } = await supabase
    .from("member_profiles")
    .select("display_name, occupation, company_or_industry, bio, education")
    .eq("membership_id", membershipId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("member_profiles")
    .upsert(
      {
        membership_id: membershipId,
        display_name: parsed.data.displayName,
        occupation: parsed.data.occupation,
        company_or_industry: parsed.data.companyOrIndustry,
        bio: parsed.data.bio,
        education: parsed.data.education,
      },
      { onConflict: "membership_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordAuditEvent({
    actorUserId: guard.user.id,
    communityId: null,
    entityType: "membership",
    entityId: membershipId,
    action: "profile_corrected_by_admin",
    beforeValue: before ?? null,
    afterValue: {
      display_name: parsed.data.displayName,
      occupation: parsed.data.occupation ?? null,
      company_or_industry: parsed.data.companyOrIndustry ?? null,
      bio: parsed.data.bio ?? null,
      education: parsed.data.education ?? null,
    },
  });

  return NextResponse.json(data);
}
