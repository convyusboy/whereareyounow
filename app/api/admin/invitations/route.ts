import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvitationSchema } from "@/lib/validation/invitation";
import { createInvitation } from "@/lib/db/queries/invitations";

export async function GET() {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, code_display_hint, status, prefill_data, expires_at, created_at")
    .eq("community_id", community!.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Returns the raw invitation code exactly once, in this response — only its
// hash is ever persisted (see lib/crypto/identifierHash.ts). The admin must
// copy it now to send manually; Phase 1 has no transactional invite email.
export async function POST(request: NextRequest) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => ({}));
  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const result = await createInvitation({
    communityId: community!.id,
    createdByUserId: guard.user.id,
    email: parsed.data.email,
    prefillData: parsed.data.prefill,
    expiresAt: parsed.data.expiresAt,
  });

  return NextResponse.json(
    { invitationId: result.invitationId, code: result.rawCode },
    { status: 201 }
  );
}
