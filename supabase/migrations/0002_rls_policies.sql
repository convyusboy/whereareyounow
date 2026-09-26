-- Row-level security: defense in depth alongside server-side API/route checks
-- (PRD 7.8, 12). Every table gets RLS enabled; security-definer helper functions
-- avoid recursive policy subqueries on community_memberships.

create or replace function is_platform_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function is_community_admin(target_community_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from community_memberships
    where user_id = auth.uid() and community_id = target_community_id
      and role = 'community_admin' and status = 'approved'
  ) or is_platform_admin();
$$;

create or replace function owns_membership(target_membership_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from community_memberships
    where id = target_membership_id and user_id = auth.uid()
  );
$$;

-- Atomically consumes an invitation and creates the resulting membership, so a
-- partial failure can never leave an invitation half-redeemed. Called from a
-- server route using the service-role client, after Supabase Auth signup
-- succeeds. Not exposed to anon/authenticated roles.
create or replace function redeem_invitation(p_invitation_id uuid, p_user_id uuid)
returns community_memberships
language plpgsql security definer set search_path = public as $$
declare
  v_invitation invitations;
  v_membership community_memberships;
begin
  select * into v_invitation from invitations where id = p_invitation_id and status = 'pending'
    for update;

  if v_invitation is null then
    raise exception 'invitation not found or not pending';
  end if;

  if v_invitation.expires_at is not null and v_invitation.expires_at < now() then
    raise exception 'invitation expired';
  end if;

  insert into community_memberships (user_id, community_id, unique_identifier_hash, status)
  values (p_user_id, v_invitation.community_id, v_invitation.identifier_hash, 'pending')
  returning * into v_membership;

  update invitations
    set status = 'redeemed', redeemed_by_membership_id = v_membership.id, redeemed_at = now()
    where id = p_invitation_id;

  return v_membership;
end;
$$;

revoke all on function redeem_invitation(uuid, uuid) from public, anon, authenticated;

alter table communities enable row level security;
alter table platform_admins enable row level security;
alter table community_memberships enable row level security;
alter table member_profiles enable row level security;
alter table locations enable row level security;
alter table member_locations enable row level security;
alter table invitations enable row level security;
alter table audit_events enable row level security;
alter table login_attempts enable row level security;

-- communities: public read (needed for community config lookup by slug), admin-only write.
create policy communities_select_all on communities for select using (true);
create policy communities_admin_write on communities for all
  using (is_platform_admin()) with check (is_platform_admin());

-- locations: public read (needed for onboarding location picker validation), admin-only write.
create policy locations_select_all on locations for select using (true);
create policy locations_admin_write on locations for all
  using (is_platform_admin()) with check (is_platform_admin());

-- platform_admins: only platform admins can see the list; no client write path.
create policy platform_admins_select on platform_admins for select using (is_platform_admin());

-- community_memberships: read own row or as community admin; admin can update
-- (approve/reject/suspend/role changes); no client insert policy at all —
-- creation only happens via redeem_invitation() or an admin-only API route
-- using the service-role client.
create policy memberships_select_own_or_admin on community_memberships for select
  using (user_id = auth.uid() or is_community_admin(community_id));
create policy memberships_admin_update on community_memberships for update
  using (is_community_admin(community_id)) with check (is_community_admin(community_id));

-- member_profiles: read/update own row (via membership ownership) or as community admin.
create policy profiles_select_own_or_admin on member_profiles for select
  using (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_profiles.membership_id and is_community_admin(cm.community_id)
    )
  );
create policy profiles_insert_own on member_profiles for insert
  with check (owns_membership(membership_id));
create policy profiles_update_own_or_admin on member_profiles for update
  using (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_profiles.membership_id and is_community_admin(cm.community_id)
    )
  )
  with check (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_profiles.membership_id and is_community_admin(cm.community_id)
    )
  );

-- member_locations mirrors member_profiles: own row (any operation) or community admin.
create policy locations_select_own_or_admin on member_locations for select
  using (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_locations.membership_id and is_community_admin(cm.community_id)
    )
  );
create policy locations_write_own_or_admin on member_locations for insert
  with check (owns_membership(membership_id));
create policy locations_update_own_or_admin on member_locations for update
  using (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_locations.membership_id and is_community_admin(cm.community_id)
    )
  )
  with check (
    owns_membership(membership_id)
    or exists (
      select 1 from community_memberships cm
      where cm.id = member_locations.membership_id and is_community_admin(cm.community_id)
    )
  );

-- invitations: admin-only via RLS. Anonymous code redemption never goes through this
-- policy — it uses the service-role client server-side, since no session exists yet
-- at that point in the flow.
create policy invitations_admin_all on invitations for all
  using (is_community_admin(community_id)) with check (is_community_admin(community_id));

-- audit_events: read-only for the relevant community's admins (or platform admins);
-- writes happen only via the service-role client from server code.
create policy audit_admin_select on audit_events for select
  using (community_id is null and is_platform_admin() or is_community_admin(community_id));

-- login_attempts: no client access at all; read/write only via the service-role client.
-- (No policy is added, so RLS default-denies all anon/authenticated access.)
