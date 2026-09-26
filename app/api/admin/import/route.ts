import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { importRosterCsv } from "@/lib/csv/rosterImport";

// Incremental-add path for the roster importer (the bulk historical load
// runs once via scripts/import-roster.ts). Accepts a CSV file upload.
export async function POST(request: NextRequest) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "no CSV file provided" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const csvContent = await file.text();

  try {
    const summary = await importRosterCsv(csvContent, community!.id, guard.user.id);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "import failed" },
      { status: 500 }
    );
  }
}
