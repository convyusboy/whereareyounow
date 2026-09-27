-- Fixes the FK gap found during manual testing: hard-deleting a membership
-- that had redeemed an invitation failed with a foreign key violation,
-- since invitations.redeemed_by_membership_id had no ON DELETE action.
-- SET NULL keeps the invitation as a historical record (its redemption
-- happened) without blocking a legitimate hard delete of the membership.
alter table invitations drop constraint invitations_redeemed_by_membership_id_fkey;
alter table invitations add constraint invitations_redeemed_by_membership_id_fkey
  foreign key (redeemed_by_membership_id) references community_memberships(id) on delete set null;
