import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client: bypasses RLS entirely. Only for code paths that must
// run before a session exists (invitation-code lookup during redemption),
// or that are already gated by an explicit requireCommunityAdmin()/
// requirePlatformAdmin() check. Never call this on behalf of an action that
// should be constrained by the acting user's own permissions.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
