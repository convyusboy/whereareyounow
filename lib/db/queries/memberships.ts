import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { codeDisplayHint, generateInvitationCode, hashIdentifier } from "@/lib/crypto/identifierHash";
import { recordAuditEvent } from "./audit";
import type { Database } from "@/types/database";

type MembershipStatus = "pending" | "approved" | "suspended" | "rejected" | "deleted";
type MembershipUpdate = Database["public"]["Tables"]["community_memberships"]["Update"];

export async function updateMembershipStatus(
  membershipId: string,
  status: MembershipStatus,
  actorUserId: string
) {
  const supabase = createAdminClient();

  const { data: before, error: beforeError } = await supabase
    .from("community_memberships")
    .select("*")
    .eq("id", membershipId)
    .single();
  if (beforeError) throw beforeError;

  const patch: MembershipUpdate = { status };
  if (status === "approved") {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = actorUserId;
    if (!before.joined_at) patch.joined_at = new Date().toISOString();
  }
  if (status === "deleted") {
    patch.deleted_at = new Date().toISOString();
  }

  const { data: after, error } = await supabase
    .from("community_memberships")
    .update(patch)
    .eq("id", membershipId)
    .select("*")
    .single();
  if (error) throw error;

  await recordAuditEvent({
    actorUserId,
    communityId: after.community_id,
    entityType: "membership",
    entityId: membershipId,
    action: `status_changed_to_${status}`,
    beforeValue: { status: before.status },
    afterValue: { status: after.status },
  });

  return after;
}

interface AdminCreateMemberInput {
  communityId: string;
  email: string;
  createdByUserId: string;
  displayName: string;
  occupation?: string;
  companyOrIndustry?: string;
  locationId: string;
  effectiveFrom: string;
}

// Manual admin "add member" (PRD 7.9): auto-approves per the Phase 1 decision,
// and retroactively records a redeemed invitation so the identifier/uniqueness
// model stays consistent regardless of how the record was created. Creates the
// underlying auth.users row via the Supabase admin API (no email sent — the
// member signs in later with their own magic-link request using this email),
// since a real auth user must exist before a membership can reference it.
export async function adminCreateMember(input: AdminCreateMemberInput) {
  const supabase = createAdminClient();
  const rawCode = generateInvitationCode();
  const identifierHash = hashIdentifier(rawCode);
  const now = new Date().toISOString();

  const { data: existingUsers, error: lookupError } = await supabase.auth.admin.listUsers();
  if (lookupError) throw lookupError;
  let userId = existingUsers.users.find(
    (u) => u.email?.toLowerCase() === input.email.toLowerCase()
  )?.id;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
    });
    if (createError) throw createError;
    userId = created.user.id;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("community_memberships")
    .insert({
      user_id: userId,
      community_id: input.communityId,
      unique_identifier_hash: identifierHash,
      status: "approved",
      joined_at: now,
      approved_at: now,
      approved_by: input.createdByUserId,
    })
    .select("*")
    .single();
  if (membershipError) throw membershipError;

  const { error: invitationError } = await supabase.from("invitations").insert({
    community_id: input.communityId,
    identifier_hash: identifierHash,
    code_display_hint: codeDisplayHint(rawCode),
    status: "redeemed",
    created_by: input.createdByUserId,
    redeemed_by_membership_id: membership.id,
    redeemed_at: now,
  });
  if (invitationError) throw invitationError;

  const { error: profileError } = await supabase.from("member_profiles").insert({
    membership_id: membership.id,
    display_name: input.displayName,
    occupation: input.occupation,
    company_or_industry: input.companyOrIndustry,
    profile_completed_at: now,
  });
  if (profileError) throw profileError;

  const { error: locationError } = await supabase.from("member_locations").insert({
    membership_id: membership.id,
    location_id: input.locationId,
    effective_from: input.effectiveFrom,
    is_current: true,
  });
  if (locationError) throw locationError;

  await recordAuditEvent({
    actorUserId: input.createdByUserId,
    communityId: input.communityId,
    entityType: "membership",
    entityId: membership.id,
    action: "created_by_admin_auto_approved",
  });

  return membership;
}
