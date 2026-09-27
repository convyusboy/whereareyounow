import { NextResponse } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMemberApi } from "@/lib/auth/roles";
import { requestAccountDeletion } from "@/lib/db/queries/memberships";

export async function POST() {
  const guard = await requireMemberApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  await requestAccountDeletion(guard.membership.id, guard.membership.user_id);
  return NextResponse.json({ ok: true });
}
