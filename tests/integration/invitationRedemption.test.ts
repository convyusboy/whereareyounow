import { afterEach, describe, expect, it } from "vitest";
import { createInvitation, redeemInvitation } from "@/lib/db/queries/invitations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createThrowawayUser, deleteUser, getLenteraCommunityId } from "../helpers";

const createdUserIds: string[] = [];

afterEach(async () => {
  await Promise.all(createdUserIds.splice(0).map(deleteUser));
});

describe("invitation creation + redemption", () => {
  it("creates an invitation whose raw code is never stored, only its hash", async () => {
    const communityId = await getLenteraCommunityId();
    const admin = await createThrowawayUser("test-admin");
    createdUserIds.push(admin.userId);

    const { invitationId, rawCode } = await createInvitation({
      communityId,
      createdByUserId: admin.userId,
    });
    expect(rawCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    const supabase = createAdminClient();
    const { data: invitation } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    expect(invitation!.status).toBe("pending");
    expect(JSON.stringify(invitation)).not.toContain(rawCode);

    await supabase.from("invitations").delete().eq("id", invitationId);
  });

  it("redeems an invitation exactly once and rejects a second redemption", async () => {
    const communityId = await getLenteraCommunityId();
    const admin = await createThrowawayUser("test-admin");
    const member = await createThrowawayUser("test-member");
    createdUserIds.push(admin.userId, member.userId);

    const { invitationId } = await createInvitation({ communityId, createdByUserId: admin.userId });

    const membership = await redeemInvitation(invitationId, member.userId);
    expect(membership.status).toBe("pending");
    expect(membership.user_id).toBe(member.userId);

    await expect(redeemInvitation(invitationId, member.userId)).rejects.toThrow();

    const supabase = createAdminClient();
    const { data: invitation } = await supabase
      .from("invitations")
      .select("status")
      .eq("id", invitationId)
      .single();
    expect(invitation!.status).toBe("redeemed");
  });
});
