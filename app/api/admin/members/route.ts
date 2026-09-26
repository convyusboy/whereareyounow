import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminCreateMemberSchema } from "@/lib/validation/member";
import { adminCreateMember } from "@/lib/db/queries/memberships";

const STATUSES = ["pending", "approved", "suspended", "rejected", "deleted"] as const;

export async function GET(request: NextRequest) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("q");

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  let query = supabase
    .from("community_memberships")
    .select("*, member_profiles(display_name, occupation)")
    .eq("community_id", community!.id)
    .order("created_at", { ascending: false });

  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    query = query.eq("status", status as (typeof STATUSES)[number]);
  }
  if (search) query = query.ilike("member_profiles.display_name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = adminCreateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  try {
    const membership = await adminCreateMember({
      communityId: community!.id,
      createdByUserId: guard.user.id,
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      occupation: parsed.data.occupation,
      companyOrIndustry: parsed.data.companyOrIndustry,
      locationId: parsed.data.locationId,
      effectiveFrom: parsed.data.effectiveFrom,
    });
    return NextResponse.json(membership, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to create member";
    const status = message.includes("duplicate") || message.includes("23505") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
