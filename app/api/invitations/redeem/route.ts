import { NextResponse, type NextRequest } from "next/server";
import { redeemInvitationSchema } from "@/lib/validation/invitation";
import { checkRateLimit, recordAttempt } from "@/lib/ratelimit/attempts";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPendingInvitation } from "@/lib/db/queries/invitations";
import { signValue } from "@/lib/crypto/signedCookie";

const INVITE_COOKIE = "pending_invitation";
const INVITE_COOKIE_MAX_AGE_SECONDS = 15 * 60;

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Step 2 of Journey C: validates a submitted invitation code and, on
// success, sets a short-lived signed cookie referencing it so the next step
// (magic-link signup) doesn't need the client to resubmit the raw code.
// Uses the service-role client throughout, since no session exists yet.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = redeemInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ip = clientIp(request);
  const { allowed } = await checkRateLimit(ip, "invitation_redeem");
  if (!allowed) {
    return NextResponse.json(
      { error: "too many attempts, please try again later" },
      { status: 429 }
    );
  }
  await recordAttempt(ip, "invitation_redeem");

  const supabase = createAdminClient();
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, slug")
    .eq("slug", parsed.data.communitySlug)
    .maybeSingle();

  if (communityError || !community) {
    return NextResponse.json({ error: "community not found" }, { status: 404 });
  }

  const invitation = await findPendingInvitation({
    communityId: community.id,
    rawCode: parsed.data.code,
  });

  if (!invitation) {
    return NextResponse.json({ error: "invalid or expired invitation code" }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    prefillEmail: invitation.email ?? null,
  });

  response.cookies.set(INVITE_COOKIE, signValue(invitation.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INVITE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
