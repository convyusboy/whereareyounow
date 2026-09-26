import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

interface RecordAuditEventInput {
  actorUserId: string | null;
  communityId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
}

function toJson(value: Record<string, unknown> | null | undefined): Json | null {
  return value === null || value === undefined ? null : (value as Json);
}

// Every admin mutation and every membership/profile status change must call
// this from the start (Phase 1 plan, build step 13) rather than have audit
// logging retrofitted later. Uses the service-role client since audit_events
// has no client insert policy.
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_events").insert({
    actor_user_id: input.actorUserId,
    community_id: input.communityId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    before_value: toJson(input.beforeValue),
    after_value: toJson(input.afterValue),
  });
  if (error) throw error;
}
