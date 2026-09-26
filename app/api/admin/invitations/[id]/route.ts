import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/db/queries/audit";

// Revokes a pending invitation (PRD 7.8: "admins must be able to revoke an
// invitation... without deleting historical data" — so this updates status
// rather than deleting the row).
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  await recordAuditEvent({
    actorUserId: guard.user.id,
    communityId: data.community_id,
    entityType: "invitation",
    entityId: id,
    action: "revoked",
  });

  return NextResponse.json(data);
}
