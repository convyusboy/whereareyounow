import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getMembership(communitySlug: string) {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", communitySlug)
    .single();
  if (!community) return null;

  const { data: membership } = await supabase
    .from("community_memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("community_id", community.id)
    .maybeSingle();

  return membership;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function isCommunityAdmin(communitySlug: string): Promise<boolean> {
  if (await isPlatformAdmin()) return true;

  const membership = await getMembership(communitySlug);
  return !!membership && membership.role === "community_admin" && membership.status === "approved";
}
