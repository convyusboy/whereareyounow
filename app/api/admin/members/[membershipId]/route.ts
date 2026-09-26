import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminUpdateMemberStatusSchema } from "@/lib/validation/member";
import { updateMembershipStatus } from "@/lib/db/queries/memberships";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const { membershipId } = await params;
  const supabase = createAdminClient();

  const [{ data: membership, error }, { data: profile }, { data: location }, { data: auditEvents }] =
    await Promise.all([
      supabase.from("community_memberships").select("*").eq("id", membershipId).single(),
      supabase.from("member_profiles").select("*").eq("membership_id", membershipId).maybeSingle(),
      supabase
        .from("member_locations")
        .select("*, locations(*)")
        .eq("membership_id", membershipId)
        .order("effective_from", { ascending: false }),
      supabase
        .from("audit_events")
        .select("*")
        .eq("entity_type", "membership")
        .eq("entity_id", membershipId)
        .order("created_at", { ascending: false }),
    ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ membership, profile, locations: location, auditEvents });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const { membershipId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminUpdateMemberStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await updateMembershipStatus(membershipId, parsed.data.status, guard.user.id);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to update member" },
      { status: 500 }
    );
  }
}
