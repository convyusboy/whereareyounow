import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdminApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvitation } from "@/lib/db/queries/invitations";

const retryRowSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  company: z.string().trim().optional(),
  locationId: z.string().uuid(),
});

// Completes a single CSV row the bulk importer flagged as
// "unresolved_location", once the admin has manually picked the right
// location — avoids re-uploading and re-processing the whole file for one
// bad row (PRD Phase 4: "reports and corrections").
export async function POST(request: NextRequest) {
  const guard = await requireCommunityAdminApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = retryRowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const { invitationId, rawCode } = await createInvitation({
    communityId: community!.id,
    createdByUserId: guard.user.id,
    email: parsed.data.email,
    prefillData: {
      displayName: parsed.data.name,
      phone: parsed.data.phone,
      occupation: parsed.data.occupation,
      companyOrIndustry: parsed.data.company,
      locationId: parsed.data.locationId,
      locationMatchedAt: "manual",
    },
  });

  return NextResponse.json({ invitationId, rawCode });
}
