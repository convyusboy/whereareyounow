import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Postgres-backed rate limiter (PRD 7.8 / 12: registration, login, and
// invitation-redemption attempts must be rate-limited). Deliberately simple —
// a fixed window count against login_attempts — rather than a dedicated
// service, per the Phase 1 decision to avoid a new external dependency at
// this scale.
export type AttemptType = "admin_login" | "member_login" | "invitation_redeem";

const WINDOW_MINUTES = Number(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES ?? 15);
const MAX_ATTEMPTS = Number(process.env.LOGIN_ATTEMPT_MAX ?? 5);

export async function checkRateLimit(
  identifier: string,
  attemptType: AttemptType
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { count, error } = await supabase
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("attempt_type", attemptType)
    .gte("created_at", windowStart);

  if (error) throw error;

  const used = count ?? 0;
  return { allowed: used < MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - used) };
}

export async function recordAttempt(identifier: string, attemptType: AttemptType): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("login_attempts")
    .insert({ identifier, attempt_type: attemptType });
  if (error) throw error;
}
