-- Phase 1 core schema: communities, memberships, profiles, locations, invitations, audit, rate limiting.
-- See prd-lentera-ascii.md section 9 (Suggested Data Model) and the Phase 1 implementation plan.

create extension if not exists "pgcrypto";

create type membership_role as enum ('member', 'community_admin');
create type membership_status as enum ('pending', 'approved', 'suspended', 'rejected', 'deleted');
create type invitation_status as enum ('pending', 'redeemed', 'revoked', 'expired');
create type field_visibility as enum ('members', 'admin_only', 'hidden');

create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text,
  branding_config jsonb not null default '{}'::jsonb,
  -- privacy_config e.g. {"public_suppression_threshold": 5}
  privacy_config jsonb not null default '{}'::jsonb,
  -- 'invitation_code' (Lentera) | 'nim' (ASCII, future)
  identifier_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Platform admins manage shared infrastructure/config across all communities (PRD 4).
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One row per (user, community). A single auth.users identity may hold a membership
-- in more than one community (PRD section 5, shared login identity design).
create table community_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references communities(id) on delete restrict,
  -- HMAC-SHA256 hash of the raw invitation code / NIM; raw value is never stored.
  unique_identifier_hash text not null,
  status membership_status not null default 'pending',
  role membership_role not null default 'member',
  joined_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, user_id),
  unique (community_id, unique_identifier_hash)
);
create index idx_memberships_community_status on community_memberships(community_id, status);

create table member_profiles (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null unique references community_memberships(id) on delete cascade,
  display_name text not null,
  photo_url text,
  occupation text,
  company_or_industry text,
  bio text,
  education text,
  -- per-field visibility, e.g. {"occupation": "members", "company_or_industry": "admin_only"}
  visibility_config jsonb not null default '{}'::jsonb,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  province_code text,
  province_name text,
  city_code text,
  city_name text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (country_code, province_code, city_code)
);

-- Historical locations are supported in the model even though Phase 1 only surfaces
-- the current one (PRD section 7.2's forward-compatibility note).
create table member_locations (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references community_memberships(id) on delete cascade,
  location_id uuid not null references locations(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);
-- Enforce at most one "current" location per membership.
create unique index idx_one_current_location on member_locations(membership_id) where (is_current);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  identifier_hash text not null,
  -- e.g. last 4 characters, for admin UI display; never the full code.
  code_display_hint text,
  email text,
  -- roster-import prefill: name/occupation/company/location, applied at onboarding.
  prefill_data jsonb,
  status invitation_status not null default 'pending',
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  redeemed_by_membership_id uuid references community_memberships(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (community_id, identifier_hash)
);
create index idx_invitations_community_status on invitations(community_id, status);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  community_id uuid references communities(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_community_created on audit_events(community_id, created_at desc);

-- Backs the Postgres-based rate limiter for login / invitation-redemption attempts.
-- identifier is an email or IP address; no FK, since attempts may precede any account.
create table login_attempts (
  id bigint generated always as identity primary key,
  identifier text not null,
  attempt_type text not null,
  created_at timestamptz not null default now()
);
create index idx_login_attempts_lookup on login_attempts(identifier, attempt_type, created_at);
