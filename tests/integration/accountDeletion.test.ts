import { afterEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { requestAccountDeletion } from "@/lib/db/queries/memberships";
import { createAdminClient } from "@/lib/supabase/admin";
import { createThrowawayUser, deleteUser, getLenteraCommunityId } from "../helpers";

const createdUserIds: string[] = [];

afterEach(async () => {
  await Promise.all(createdUserIds.splice(0).map(deleteUser));
});

describe("requestAccountDeletion", () => {
  it("marks the membership deleted and anonymizes the profile, keeping an audit trail", async () => {
    const supabase = createAdminClient();
    const communityId = await getLenteraCommunityId();
    const user = await createThrowawayUser("test-deletion");
    createdUserIds.push(user.userId);

    const { data: membership } = await supabase
      .from("community_memberships")
      .insert({
        user_id: user.userId,
        community_id: communityId,
        unique_identifier_hash: crypto.randomBytes(32).toString("hex"),
        status: "approved",
        role: "member",
      })
      .select("id")
      .single();

    await supabase.from("member_profiles").insert({
      membership_id: membership!.id,
      display_name: "Someone To Delete",
      occupation: "Test Occupation",
      bio: "Some bio text",
      profile_completed_at: new Date().toISOString(),
    });

    await requestAccountDeletion(membership!.id, user.userId);

    const { data: afterMembership } = await supabase
      .from("community_memberships")
      .select("status, deleted_at")
      .eq("id", membership!.id)
      .single();
    expect(afterMembership!.status).toBe("deleted");
    expect(afterMembership!.deleted_at).not.toBeNull();

    const { data: afterProfile } = await supabase
      .from("member_profiles")
      .select("*")
      .eq("membership_id", membership!.id)
      .single();
    expect(afterProfile!.display_name).toBe("Deleted member");
    expect(afterProfile!.occupation).toBeNull();
    expect(afterProfile!.bio).toBeNull();

    const { data: auditEvents } = await supabase
      .from("audit_events")
      .select("action")
      .eq("entity_id", membership!.id)
      .eq("action", "self_deleted_and_anonymized");
    expect(auditEvents).toHaveLength(1);
  });
});
