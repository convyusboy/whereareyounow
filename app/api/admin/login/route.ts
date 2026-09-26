import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { checkRateLimit, recordAttempt } from "@/lib/ratelimit/attempts";
import { createClient } from "@/lib/supabase/server";
import { isCommunityAdmin } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/db/queries/audit";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// Dedicated admin login (PRD 7.8): rate-limited and logged on every attempt,
// success or failure. TOTP enrollment/verification is left as an optional
// follow-up (the PRD marks MFA "optional" for admins) rather than built in
// Phase 1, given the scope already covered here.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const { allowed } = await checkRateLimit(email, "admin_login");
  if (!allowed) {
    return NextResponse.json({ error: "too many attempts, please try again later" }, { status: 429 });
  }
  await recordAttempt(email, "admin_login");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    await recordAuditEvent({
      actorUserId: null,
      communityId: null,
      entityType: "admin_session",
      entityId: null,
      action: "admin_login_failed",
      afterValue: { email },
    });
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  if (!(await isCommunityAdmin(DEFAULT_COMMUNITY_SLUG))) {
    await recordAuditEvent({
      actorUserId: data.user.id,
      communityId: null,
      entityType: "admin_session",
      entityId: data.user.id,
      action: "admin_login_rejected_not_admin",
    });
    await supabase.auth.signOut();
    return NextResponse.json({ error: "this account is not an admin" }, { status: 403 });
  }

  await recordAuditEvent({
    actorUserId: data.user.id,
    communityId: null,
    entityType: "admin_session",
    entityId: data.user.id,
    action: "admin_login_success",
  });

  return NextResponse.json({ ok: true });
}
