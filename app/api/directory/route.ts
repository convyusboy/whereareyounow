import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMemberApi } from "@/lib/auth/roles";
import { getDirectoryMembers } from "@/lib/db/queries/directory";

// Only approved members may browse the directory — pending/suspended
// accounts can see their own /profile status page but not other members.
export async function GET(request: NextRequest) {
  const guard = await requireMemberApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  if (guard.membership.status !== "approved") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const country = request.nextUrl.searchParams.get("country") ?? undefined;

  const members = await getDirectoryMembers(DEFAULT_COMMUNITY_SLUG, { search, country });
  return NextResponse.json(members);
}
