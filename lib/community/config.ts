import { lentera } from "./communities/lentera";

export type IdentifierType = "invitation_code" | "nim";

export interface CommunityConfig {
  slug: string;
  name: string;
  shortDescription: string;
  identifierType: IdentifierType;
  publicSuppressionThreshold: number;
  branding: {
    primaryColor: string;
    logoUrl?: string;
  };
}

// Phase 1 ships Lentera only; ASCII is added here once it needs a working UI
// (see the Phase 1 plan's "build order" decision — the data model already
// supports multiple communities without a rewrite).
const communities: Record<string, CommunityConfig> = {
  [lentera.slug]: lentera,
};

export function getCommunityConfig(slug: string): CommunityConfig | undefined {
  return communities[slug];
}

export function listCommunityConfigs(): CommunityConfig[] {
  return Object.values(communities);
}

// Phase 1 only has a working UI for Lentera (see "build order" in the Phase 1
// plan), so non-parametrized routes (/login, /onboarding, /admin/*) assume
// this community rather than taking a slug in the URL. Only
// /register/[communitySlug] is parametrized, ready for ASCII later.
export const DEFAULT_COMMUNITY_SLUG = lentera.slug;
