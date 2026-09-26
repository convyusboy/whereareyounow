-- Seeds the Lentera community row (Phase 1 plan, build step 6). ASCII is added
-- here later once it gets a working UI, per the Phase 1 build-order decision.
insert into communities (slug, name, short_description, identifier_type, privacy_config, branding_config)
values (
  'lentera',
  'Lentera',
  'SMA Taruna Nusantara, angkatan 19 (masuk 2008)',
  'invitation_code',
  jsonb_build_object('public_suppression_threshold', 5),
  jsonb_build_object('primary_color', '#0f4c81')
)
on conflict (slug) do nothing;
