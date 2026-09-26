import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMemberApi } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveLocation } from "@/lib/db/queries/locations";

const updateLocationSchema = z.object({
  countryName: z.string().trim().min(1),
  provinceName: z.string().trim().optional(),
  cityName: z.string().trim().optional(),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "expected YYYY-MM")
    .transform((value) => `${value}-01`),
});

// Upsert semantics via effective-dating: closes out the previous "current"
// row (if any) and inserts a new current one, keeping full history in the
// model even though Phase 1 only surfaces the current location (PRD 7.2).
export async function PATCH(request: NextRequest) {
  const guard = await requireMemberApi(DEFAULT_COMMUNITY_SLUG);
  if ("response" in guard) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const resolved = await resolveLocation({
    countryName: parsed.data.countryName,
    provinceName: parsed.data.provinceName,
    cityName: parsed.data.cityName,
  });

  if (!resolved.locationId) {
    return NextResponse.json({ error: "could not resolve that location" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: closeError } = await supabase
    .from("member_locations")
    .update({ is_current: false, effective_to: parsed.data.effectiveFrom })
    .eq("membership_id", guard.membership.id)
    .eq("is_current", true);
  if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 });

  const { data, error } = await supabase
    .from("member_locations")
    .insert({
      membership_id: guard.membership.id,
      location_id: resolved.locationId,
      effective_from: parsed.data.effectiveFrom,
      is_current: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, matched: resolved.matched });
}
