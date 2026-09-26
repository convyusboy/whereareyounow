import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifySignedValue } from "@/lib/crypto/signedCookie";
import { redeemInvitation } from "@/lib/db/queries/invitations";

const INVITE_COOKIE = "pending_invitation";

// Completes the magic-link sign-in (Supabase PKCE flow: exchanges the `code`
// query param for a session), then, if a pending invitation was recorded by
// /api/invitations/redeem earlier in Journey C, consumes it to create the
// membership. Idempotent: redeemInvitation() failing because the invitation
// is no longer "pending" (e.g. the user double-clicked the email link, or
// already has a membership from a prior visit) is treated as already-done,
// not an error.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }

  const cookieStore = await cookies();
  const invitationId = verifySignedValue(cookieStore.get(INVITE_COOKIE)?.value);

  if (invitationId) {
    try {
      await redeemInvitation(invitationId, data.user.id);
    } catch {
      // Already redeemed (e.g. double-click) or expired since validation — the
      // membership check inside requireMember() on /onboarding is the real gate.
    }
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete(INVITE_COOKIE);
  return response;
}
