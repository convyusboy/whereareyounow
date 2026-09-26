import { NextResponse } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMemberApi } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const guard = await requireMemberApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("membership_id", guard.membership.id)
    .maybeSingle();

  const { data: location } = await supabase
    .from("member_locations")
    .select("*, locations(*)")
    .eq("membership_id", guard.membership.id)
    .eq("is_current", true)
    .maybeSingle();

  return NextResponse.json({ membership: guard.membership, profile, location });
}
