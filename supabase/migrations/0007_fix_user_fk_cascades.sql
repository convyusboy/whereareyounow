-- Fixes a significant gap found via automated tests: several FKs referencing
-- auth.users(id) had no ON DELETE action, defaulting to RESTRICT. In
-- practice this silently blocked deleting ANY user who ever triggered an
-- audit event (i.e. almost anyone who used the app at all) or redeemed
-- their own invitation, since audit_events.actor_user_id referenced them.
-- An audit trail existing must never be the reason a legitimate account
-- deletion fails — SET NULL keeps the historical record while releasing
-- the reference.
alter table audit_events drop constraint audit_events_actor_user_id_fkey;
alter table audit_events add constraint audit_events_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete set null;

alter table community_memberships drop constraint community_memberships_approved_by_fkey;
alter table community_memberships add constraint community_memberships_approved_by_fkey
  foreign key (approved_by) references auth.users(id) on delete set null;

alter table invitations alter column created_by drop not null;
alter table invitations drop constraint invitations_created_by_fkey;
alter table invitations add constraint invitations_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;
