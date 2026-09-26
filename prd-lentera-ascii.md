# Product Requirements Document

## Lentera & ASCII

**Status:** Draft  
**Product type:** Private community directory with a public aggregate map  
**Products:**

- **Lentera** — community directory for SMA Taruna Nusantara angkatan 19
- **ASCII** — community directory for Teknik Informatika ITB, class of 2011

## 1. Product Summary

Lentera and ASCII are two related websites that help alumni and former classmates understand where members of their community are currently distributed geographically.

The core experience is an interactive, map-based directory:

- Anyone can see aggregate population counts on the map.
- Authenticated or invited members can see who is in a location and view their approved profile details.
- The map supports drill-down from the world to country, Indonesia, province, and city.
- Members can maintain their own current location, work information, and other optional profile data.

The products should share a common technical foundation and design system while keeping each community’s branding, membership, and data separate.

## 2. Problem

Members of a school or university cohort often lose visibility into where others live and work after graduation. Existing group chats and spreadsheets are difficult to maintain, do not provide a useful geographic overview, and make it hard to answer questions such as:

- How many members are currently in Jakarta?
- Who lives in Bandung?
- How many people are outside Indonesia?
- Which countries have members from this cohort?
- What kinds of work are members doing in a particular city?

Lentera and ASCII should turn this information into a living, easy-to-explore community map while respecting the privacy of individual members.

## 3. Goals

### Community definitions

- **Lentera:** SMA Taruna Nusantara Magelang, angkatan 19, masuk tahun 2008.
- **ASCII:** Teknik Informatika ITB, angkatan masuk 2011.

The initial Lentera context and visual/documentation reference is the public Instagram account [@lentera.tn.xix](https://www.instagram.com/lentera.tn.xix/). The account should be treated as a reference for community identity, history, and visual direction; official membership and profile data must still come from the verified member database.

### Primary goals

1. Provide an accurate, maintainable database of community members and their current locations.
2. Show public geographic aggregates without exposing personally identifiable information.
3. Let authenticated members explore people, professions, and profile details by location.
4. Make updating one’s own information easy.
5. Support both communities through a reusable platform architecture.

### Secondary goals

1. Create a sense of connection and discovery among members.
2. Make it easy for administrators to onboard, verify, and manage members.
3. Establish a foundation for future community features such as events, reunions, and messaging.

### Non-goals for the initial release

- Publicly exposing individual names, jobs, addresses, or exact locations.
- Real-time tracking or live location sharing.
- Social feeds, chat, or direct messaging.
- Complex employment analytics or demographic reporting.
- Replacing an official alumni database or school information system.

## 4. Users and Roles

### Public visitor

Can:

- Open the website without an account.
- View aggregate counts by world, country, Indonesian province, and city.
- See the number of people outside Indonesia.
- Explore the map and navigation hierarchy.

Cannot:

- See member names.
- See individual jobs, addresses, workplaces, or profile pages.
- Search for a specific member.

### Authenticated member

Can:

- View public aggregates.
- View members and approved details within the authenticated area.
- Update their own profile and location.
- Control which optional fields are visible to other authenticated members.
- Report incorrect or outdated information.

### Community administrator

Can:

- Sign in through a dedicated admin login.
- Invite and approve members.
- Add new member records.
- Update existing member records.
- Create, suspend, or revoke member accounts.
- Correct or moderate member data.
- Manage taxonomy values such as province, city, profession, and organization.
- See audit history for material profile changes.
- Export data where permitted by the community’s governance policy.

### Platform administrator

Can:

- Manage shared infrastructure and configuration.
- Create new community instances.
- Manage roles and operational settings across Lentera and ASCII.

## 5. Privacy and Access Model

Privacy is a core product requirement because location and employment data can be sensitive.

### Visibility rules

| Data | Public visitor | Authenticated member | Admin |
|---|---:|---:|---:|
| Total member count | Yes | Yes | Yes |
| World/country/province/city counts | Yes | Yes | Yes |
| Country with fewer than a configured minimum count | Aggregated or hidden | Configurable | Yes |
| Member name | No | Yes, if member allows it | Yes |
| Profession | No | Yes, if member allows it | Yes |
| City | Only as aggregate | Yes | Yes |
| Exact address | No | No by default; optional and coarse-grained only | Yes, if collected |
| Email/phone | No | No by default | Yes, based on policy |
| Admin notes | No | No | Yes |

The MVP should not collect or display exact residential addresses. A member’s location should be represented at city level or by a deliberately approximate map coordinate.

### Account uniqueness

Each community must have a unique membership identifier:

- Lentera may use an official cohort identifier, attendance number, or invitation code for the 2008-entry angkatan 19.
- ASCII may use NIM, a verified alumni/student identifier, or an invitation code for the 2011-entry Teknik Informatika ITB cohort.

The system must enforce:

1. One active account per unique identifier within a community.
2. One unique identifier cannot be used by multiple accounts.
3. An account cannot create duplicate memberships in the same community.
4. Account creation requires verification of the identifier or an admin-approved invitation.
5. Login credentials must not expose the underlying identifier unnecessarily.

Recommended identity design: use a shared authentication service with separate community memberships. A person who belongs to both Lentera and ASCII may use one login identity linked to two verified memberships, while each community still enforces its own unique identifier.

## 6. Core User Journeys

### Journey A: Public visitor explores the map

1. Visitor opens Lentera or ASCII.
2. The site shows a world map with aggregate counts.
3. Visitor selects a country.
4. The map shows country-level counts and available drill-down.
5. Visitor selects Indonesia.
6. The map shows counts by Indonesian province.
7. Visitor selects a province.
8. The map shows counts by city.
9. Visitor sees only counts and aggregate labels, not individual members.

### Journey B: Authenticated member explores people

1. Member logs in.
2. Member explores the same map hierarchy.
3. Member selects a city or country.
4. The site shows a list of members in that area.
5. Each member card shows approved fields such as name, occupation, company/industry, and “since when”.
6. Member opens a profile for additional approved information.

### Journey C: New member joins

1. Member receives an invitation or opens the registration flow.
2. Member enters the community identifier, such as NIM, attendance number, or invitation code.
3. System validates that the identifier is unused and eligible.
4. Member creates login credentials.
5. Member completes an onboarding profile.
6. Admin may review the account before it becomes visible in authenticated member lists.

### Journey D: Member updates their information

1. Member opens “My Profile”.
2. Member edits current country, province, city, work information, and optional fields.
3. Member specifies when the current location became effective.
4. System validates required fields.
5. System records the change in audit history.
6. Updated aggregate counts appear after the next successful data refresh.

## 7. Functional Requirements

### 7.1 Community configuration

Each community instance must have:

- Name and short description.
- Logo, primary color, and basic branding.
- Community-specific membership identifier type.
- Community-specific invitation and approval rules.
- Configurable public/private profile fields.
- Configurable minimum aggregation threshold for small groups.

### 7.2 Member database

The system must store, at minimum:

- Internal member ID.
- Community membership ID.
- Unique community identifier, stored securely.
- Name.
- Profile photo, optional.
- Current country.
- Current Indonesian province, when applicable.
- Current city.
- Location effective date, represented as month/year or year.
- Occupation or professional category.
- Company, organization, or industry, optional.
- Short biography, optional.
- Education or additional affiliations, optional.
- Profile visibility settings.
- Account status.
- Created date and last updated date.

The system should support historical locations in the data model, even if the MVP only displays the current location. This allows future features such as “where members have lived over time” without redesigning the database.

### 7.3 Location hierarchy

The location model must support:

```text
World
├── Country
│   └── Region/state/province
│       └── City
└── Indonesia
    └── Province
        └── City
```

For public display:

- If the selected map view is Indonesia, people outside Indonesia are shown as a separate “Outside Indonesia” aggregate.
- If the selected map view is World, each country shows its total.
- Within Indonesia, counts are grouped by province and then by city.
- Locations with unknown or incomplete data are shown in a separate “Location not yet provided” group and do not silently disappear.

### 7.4 Interactive map

The map experience must support:

- Pan and zoom.
- Responsive desktop and mobile layouts.
- Hover or tap state for regions.
- Region labels and counts.
- Click/tap to drill down.
- Breadcrumb navigation to move back up the hierarchy.
- A list-based alternative to the map for accessibility and small screens.
- Loading, empty, and error states.
- A legend explaining what counts represent.

The map should use aggregate endpoints for public views and authenticated endpoints for member-level views. Member names and profile data must not be embedded in public map payloads.

### 7.5 Location detail panel

For public visitors, the panel may show:

- Location name.
- Total members.
- Percentage of total community, if useful.
- Child-region breakdown.

For authenticated members, the panel may additionally show:

- Member list.
- Name.
- Profile photo.
- Occupation.
- Company/industry, if visible.
- “Living here since” information.
- Profile link.

The product should avoid displaying overly precise information when a group is small. A configurable threshold should allow administrators to suppress or aggregate groups below a selected count.

### 7.6 Search and filtering

MVP:

- Search by city, province, country, and profession.
- Filter the authenticated member list by profession or industry.

Not required for MVP:

- Public member-name search.
- Full-text search across private profile fields.
- Company directory.

### 7.7 Profile management

Members must be able to:

- View their own profile.
- Edit their current location.
- Edit their work information.
- Add or remove optional profile fields.
- Choose visibility for optional fields.
- Preview how their profile appears to other members.
- Request account deletion or membership removal.

Required profile controls:

- “Visible to authenticated members”
- “Visible only to admins”
- “Not provided”

### 7.8 Authentication and account management

The system must support:

- Invite-based registration.
- Identifier-based registration.
- Email/password or passwordless login, subject to implementation choice.
- Email verification.
- Password reset or secure account recovery.
- Session expiration and logout.
- Account suspension.
- One-account-per-community enforcement.
- Dedicated admin login and admin session management.
- Role-based access control separating members, community admins, and platform admins.
- Optional multi-factor authentication for administrators.

Admins must be able to revoke an invitation and disable an account without deleting historical data.

#### Admin login and authorization requirements

- Admins must access the admin area through a separate protected route.
- Admin login must not rely on frontend-only permission checks.
- Every admin API request must verify the authenticated user’s role and community scope on the server.
- A community admin may manage only members belonging to their assigned community unless explicitly granted platform-admin access.
- Failed admin login attempts must be rate-limited and logged.
- Admin sessions must have shorter idle timeouts than regular member sessions.
- Sensitive admin actions should require confirmation and be recorded in the audit log.
- The system must support removing admin access without deleting the administrator’s underlying user account.

### 7.9 Admin tools

Admins need:

- Member table with search, filters, and status.
- Invite creation and bulk invite import.
- Approve/reject workflow where required.
- Add-member form for creating a member record manually.
- Edit-member form for updating identity, location, work, status, and visibility data.
- Member detail page showing account status, profile completeness, and update history.
- Account activation, suspension, and reactivation controls.
- Ability to link an existing verified user to a community membership where appropriate.
- Duplicate detection.
- Location data correction.
- Profession taxonomy management.
- Visibility policy management.
- Audit log.
- Data export with explicit confirmation.

### 7.10 Data quality

The system must:

- Validate that Indonesia province and city combinations are valid.
- Validate country and region relationships.
- Detect duplicate unique identifiers.
- Flag incomplete profiles.
- Track the last update timestamp.
- Show members when their location data is stale or missing to admins.
- Provide a “report incorrect information” action for authenticated members.

## 8. Recommended Information Architecture

### Public pages

- Landing page
- Public map
- About the community
- Login
- Registration/invitation acceptance
- Privacy policy

### Authenticated pages

- Member map
- Location detail
- Member profile
- My profile
- Account settings
- Report an issue

### Admin pages

- Admin login
- Admin dashboard
- Members
- Add member
- Edit member
- Member detail and audit history
- Invitations
- Locations and taxonomies
- Privacy settings
- Audit log
- Export tools

## 9. Suggested Data Model

The implementation should use a relational database with spatially or hierarchically indexed location data.

### Core entities

```text
User
- id
- email
- authentication_status
- created_at

Community
- id
- slug
- name
- branding_config
- privacy_config

CommunityMembership
- id
- user_id
- community_id
- unique_identifier_hash
- status
- role
- joined_at

MemberProfile
- id
- membership_id
- display_name
- photo_url
- occupation
- company_or_industry
- bio
- visibility_config

Location
- id
- country_code
- country_name
- province_code
- province_name
- city_code
- city_name
- latitude
- longitude

MemberLocation
- id
- membership_id
- location_id
- effective_from
- effective_to
- is_current

Invitation
- id
- community_id
- identifier_hash
- email
- status
- expires_at
- created_by

AuditEvent
- id
- actor_user_id
- community_id
- entity_type
- entity_id
- action
- before_value
- after_value
- created_at
```

Identifiers should be stored as hashes or encrypted values where practical. Raw NIM, attendance numbers, or invitation codes should not be exposed in normal application responses.

## 10. Map and Frontend Architecture

This product is intentionally frontend-heavy. The frontend should be designed as a data-visualization application rather than a set of static pages.

Recommended architecture:

- Shared frontend shell and design system.
- Community configuration loaded by slug.
- Reusable map components.
- Separate public aggregate data layer and authenticated member data layer.
- URL-driven navigation so locations can be shared and browser back/forward works.
- Client-side caching for map aggregates.
- Server-side authorization for all private member data.
- Progressive loading so the map shell appears before detailed member data.
- List view as a first-class fallback for accessibility and mobile.

Suggested frontend modules:

- `CommunityShell`
- `PublicMap`
- `AuthenticatedMap`
- `MapBreadcrumbs`
- `AggregateRegionPanel`
- `MemberList`
- `MemberCard`
- `ProfileEditor`
- `AdminMemberTable`
- `LocationHierarchy`
- `PrivacyControls`

The map provider and rendering library should be selected based on:

- Quality of country, Indonesian province, and city boundaries.
- Support for mobile touch interaction.
- Ability to style and label regions.
- Licensing and operating cost.
- Support for custom vector tiles or GeoJSON.
- Performance with multiple levels of geographic detail.

## 11. API Requirements

The backend should expose separate endpoints or authorization scopes for aggregate and private data.

### Public aggregate examples

```text
GET /api/communities/{communitySlug}/map/world
GET /api/communities/{communitySlug}/map/countries/{countryCode}
GET /api/communities/{communitySlug}/map/indonesia/provinces
GET /api/communities/{communitySlug}/map/indonesia/provinces/{provinceCode}/cities
```

These endpoints must return counts and region metadata only.

### Authenticated examples

```text
GET /api/me
GET /api/communities/{communitySlug}/members?location_id=...
GET /api/communities/{communitySlug}/members/{memberId}
PATCH /api/communities/{communitySlug}/me/profile
PATCH /api/communities/{communitySlug}/me/location
POST /api/communities/{communitySlug}/reports
```

Private endpoints must verify:

1. The user is authenticated.
2. The user has an active membership in the requested community.
3. The requested field is allowed by the member’s visibility settings.
4. The user has the required admin role for administrative actions.

## 12. Non-Functional Requirements

### Security

- Enforce server-side authorization; frontend hiding is not sufficient.
- Encrypt sensitive data in transit and at rest.
- Hash or encrypt unique membership identifiers.
- Rate-limit registration, login, invitation redemption, and profile lookup.
- Maintain audit logs for admin access and material data changes.
- Prevent public API responses from leaking member-level data.

### Performance

- Public aggregate map should render an initial usable view quickly on normal broadband.
- Map navigation should feel responsive after data is cached.
- Aggregates should be precomputed or efficiently indexed.
- Member details should load on demand rather than in the initial map payload.

### Accessibility

- Provide keyboard navigation for map controls.
- Provide a list/table alternative to geographic visualization.
- Ensure text labels and counts are readable without relying on color alone.
- Meet WCAG 2.1 AA as a product target.

### Reliability

- Graceful empty and error states.
- Backups and restore procedures for member data.
- Monitoring for authentication, API, and map-data failures.
- Clear indication when data was last updated.

### Privacy and governance

- Support data deletion and correction requests.
- Store only data needed for the product.
- Define a retention policy for inactive memberships.
- Make profile visibility understandable and reversible.

## 13. MVP Scope

### Include

- Two branded community sites using shared infrastructure.
- Invite or unique-identifier registration.
- One active account per unique member identifier per community.
- Login and account recovery.
- Dedicated admin login with role-based authorization.
- Member profile with current location and work information.
- Public world/country/Indonesia/province/city aggregate map.
- Authenticated member list by selected location.
- Profile privacy controls.
- Admin member management, including add and update member workflows.
- Basic invitation management.
- Location and profession validation.
- Responsive map and list fallback.

### Defer

- Historical movement timeline UI.
- Events and reunions.
- Messaging.
- Recommendations or matching.
- Public member-name search.
- Automated data ingestion from external alumni systems.
- Advanced analytics.
- Native mobile applications.

## 14. Success Metrics

### Adoption

- Percentage of invited members who activate accounts.
- Percentage of activated members who complete a location profile.
- Monthly active members.

### Data quality

- Percentage of members with a current location.
- Percentage of members with a recent profile update.
- Duplicate-account rate.
- Number of reported incorrect profiles resolved.

### Product usage

- Public map sessions.
- Average number of map drill-down interactions.
- Authenticated location-detail views.
- Search/filter usage.

### Trust and safety

- Unauthorized access incidents: target zero.
- Public member-data leakage: target zero.
- Account recovery success rate.
- Profile correction/deletion requests resolved within an agreed SLA.

## 15. Risks and Mitigations

### Low participation

**Risk:** The map is incomplete and quickly becomes outdated.  
**Mitigation:** Make onboarding short, show profile completeness, send periodic update prompts, and provide low-friction profile editing.

### Privacy concerns

**Risk:** Members may not want their exact location or employer exposed.  
**Mitigation:** Public aggregates only, authenticated access for details, configurable visibility, no exact residential addresses, and small-group suppression.

### Incorrect location granularity

**Risk:** Different users enter inconsistent city or province names.  
**Mitigation:** Use controlled location selection backed by a canonical geographic dataset.

### Duplicate identities

**Risk:** A member creates more than one account or an identifier is reused.  
**Mitigation:** Enforce unique identifiers at the database and service layers, with admin recovery for legitimate edge cases.

### Map complexity and performance

**Risk:** High-detail map rendering becomes slow on mobile.  
**Mitigation:** Use hierarchical loading, precomputed aggregates, simplified geometry at low zoom, and a list alternative.

### Sensitive data accumulation

**Risk:** The product collects more personal data than needed.  
**Mitigation:** Make optional fields truly optional, define retention rules, and review every new field against the privacy model.

## 16. Resolved Decisions (2026-09-26)

1. **Shared login identity.** Lentera and ASCII share one login identity (email-based); each community still enforces its own unique membership identifier, per the recommended identity design in section 5.
2. **Membership identifier per community.**
   - ASCII: NIM (verified alumni/student identifier).
   - Lentera: invitation code only, generated and sent by admins. No official cohort roster number exists to verify against, so the invite code itself is the unique identifier.
3. **Admin approval.** Required for every new account. New signups sit in a pending state until a community admin approves them.
4. **Public suppression threshold.** Locations with fewer than 5 members are aggregated/hidden on the public map. This threshold applies to the public view only; authenticated members always see exact counts and member lists per the visibility rules in section 5.
5. **Authenticated member visibility.** Any active, authenticated member can see any other active member's approved-visible fields. There is no separate "verified" tier — visibility is controlled per-field by each member (section 7.7), not by a second admin approval step.
6. **Optional profile fields at launch.** Short bio, education/other affiliations, and company/industry are all included at launch, in addition to the required current location and occupation.
7. **Map provider.** Mapbox GL JS, for Indonesia province/city boundary support and mobile touch interaction.
8. **Profile photos.** Enabled at launch as an optional upload.
9. **Data retention.** Soft-delete: a deletion request immediately hides the member from all public and authenticated views and anonymizes personal fields, while retaining an audit trail. No automatic deletion purely for inactivity.
10. **Privacy policy / consent language.** Claude drafts a placeholder privacy policy and consent copy reflecting this PRD's privacy model (section 5), clearly marked as needing legal/founder review before public launch. This does not block development.

### Seed data

A roster/contact list already exists for Lentera, containing name + contact (email/phone), current city/country, and occupation/company for at least some members. This can be used to pre-populate location and occupation data and generate targeted invitations, rather than launching from a cold start.

## 17. Recommended Delivery Phases

### Phase 1: Foundation

- Shared authentication and community model.
- Database and location hierarchy.
- Admin member management.
- Invite and unique-identifier onboarding.

### Phase 2: Public map

- World/country/Indonesia/province/city aggregate map.
- Public landing pages.
- Caching and aggregate APIs.

### Phase 3: Authenticated directory

- Member-level location panels.
- Profiles and visibility controls.
- Search and filters.

### Phase 4: Data quality and operations

- Audit logs.
- Reports and corrections.
- Data exports.
- Monitoring and backup workflows.

### Phase 5: Optional expansion

- Historical locations.
- Events and reunions.
- Community announcements.
- Cross-community identity and discovery.

## 18a. Technical Stack Decisions (2026-09-26)

The PRD itself is stack-agnostic; the following choices were made to unblock implementation:

- **Framework:** Next.js (React), full-stack — server-rendered public map plus API routes for authenticated/admin functionality in one codebase.
- **Database, auth, and file storage:** Supabase (Postgres + Auth + Storage) as a single consolidated provider. Storage backs profile photo uploads. This is a specific implementation of the shared-authentication-service design recommended in section 5.
- **Map library:** Mapbox GL JS (see section 16, item 7).
- **Hosting:** Vercel for the Next.js app, paired with Supabase's managed Postgres.
- **Build order:** Lentera ships first as a working single-community product before the shared platform pieces (community config, multi-tenant branding) are generalized for ASCII. The data model in section 9 is still designed multi-tenant from the start (`Community`, `CommunityMembership`) so this generalization is a matter of adding a second configured community, not a rewrite.

## 18. Product Principles

1. **Aggregate by default.** Public visitors see the shape of the community, not personal data.
2. **Member-owned profiles.** Members control their own current information and visibility.
3. **One person, one verified membership.** Community identifiers prevent duplicate identities.
4. **Map plus list.** The map is the primary experience, but every key action must remain usable without it.
5. **Current information first.** Show when location data was last updated and make updates easy.
6. **Shared platform, distinct communities.** Lentera and ASCII should feel related but remain independently configurable.
