import { NextResponse } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .or(`community_id.eq.${community!.id},community_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
