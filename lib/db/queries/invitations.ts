import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { codeDisplayHint, generateInvitationCode, hashIdentifier } from "@/lib/crypto/identifierHash";
import { recordAuditEvent } from "./audit";
import type { Json } from "@/types/database";

interface CreateInvitationInput {
  communityId: string;
  createdByUserId: string;
  email?: string;
  prefillData?: Record<string, unknown>;
  expiresAt?: string;
}

interface CreateInvitationResult {
  invitationId: string;
  rawCode: string;
}

// Generates a fresh high-entropy code and stores only its hash, per the
// Phase 1 decision to never persist raw invitation codes. Retries on the
// (extremely unlikely) hash collision within a community.
export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const rawCode = generateInvitationCode();
    const identifierHash = hashIdentifier(rawCode);

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        community_id: input.communityId,
        identifier_hash: identifierHash,
        code_display_hint: codeDisplayHint(rawCode),
        email: input.email,
        prefill_data: (input.prefillData ?? null) as Json | null,
        expires_at: input.expiresAt,
        created_by: input.createdByUserId,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") continue; // unique_violation on (community_id, identifier_hash)
      throw error;
    }

    await recordAuditEvent({
      actorUserId: input.createdByUserId,
      communityId: input.communityId,
      entityType: "invitation",
      entityId: data.id,
      action: "created",
      afterValue: { email: input.email ?? null, hasPrefill: !!input.prefillData },
    });

    return { invitationId: data.id, rawCode };
  }

  throw new Error("failed to generate a unique invitation code after 5 attempts");
}

interface FindPendingInvitationInput {
  communityId: string;
  rawCode: string;
}

export async function findPendingInvitation(input: FindPendingInvitationInput) {
  const supabase = createAdminClient();
  const identifierHash = hashIdentifier(input.rawCode);

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("community_id", input.communityId)
    .eq("identifier_hash", identifierHash)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;

  if (data?.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }
  return data;
}

// Atomically consumes the invitation and creates the membership via the
// redeem_invitation() Postgres function (supabase/migrations/0002), so a
// partial failure can never leave an invitation half-redeemed.
export async function redeemInvitation(invitationId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("redeem_invitation", {
    p_invitation_id: invitationId,
    p_user_id: userId,
  });
  if (error) throw error;

  await recordAuditEvent({
    actorUserId: userId,
    communityId: data.community_id,
    entityType: "membership",
    entityId: data.id,
    action: "created_via_redemption",
  });

  return data;
}
