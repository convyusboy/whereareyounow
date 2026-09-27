import "server-only";
import { parse } from "csv-parse/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { rosterRowSchema } from "@/lib/validation/roster";
import { resolveLocation } from "@/lib/db/queries/locations";
import { createInvitation } from "@/lib/db/queries/invitations";

export interface RosterImportRowResult {
  row: number;
  name: string;
  status: "invited" | "skipped_duplicate" | "unresolved_location" | "invalid";
  detail?: string;
  invitationId?: string;
  rawCode?: string;
  // Only set for unresolved_location rows, so the admin can retry just this
  // one row with a manually-picked location instead of re-uploading the
  // whole file (see /api/admin/import/retry-row).
  rawRow?: {
    name: string;
    email?: string;
    phone?: string;
    occupation?: string;
    company?: string;
  };
}

export interface RosterImportSummary {
  communityId: string;
  results: RosterImportRowResult[];
  invitedCount: number;
}

// Shared importer for the real Lentera roster (name/contact, city/country,
// occupation/company). Used by both scripts/import-roster.ts (the one-off
// bulk load) and the /admin/import UI (incremental adds). Re-runs are
// idempotent: rows whose email already has a pending/redeemed invitation
// are skipped rather than duplicated. Unresolved locations are flagged for
// manual admin mapping, never silently dropped (PRD 7.10).
export async function importRosterCsv(
  csvContent: string,
  communityId: string,
  createdByUserId: string
): Promise<RosterImportSummary> {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const supabase = createAdminClient();
  const results: RosterImportRowResult[] = [];
  let invitedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2; // account for header row, 1-indexed
    const parsed = rosterRowSchema.safeParse(records[i]);

    if (!parsed.success) {
      results.push({
        row: rowNumber,
        name: records[i].name ?? "(unknown)",
        status: "invalid",
        detail: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      continue;
    }

    const rosterRow = parsed.data;

    if (rosterRow.email) {
      const { data: existing } = await supabase
        .from("invitations")
        .select("id")
        .eq("community_id", communityId)
        .eq("email", rosterRow.email)
        .maybeSingle();

      if (existing) {
        results.push({ row: rowNumber, name: rosterRow.name, status: "skipped_duplicate" });
        continue;
      }
    }

    const resolved = await resolveLocation({
      countryName: rosterRow.country,
      provinceName: rosterRow.province || undefined,
      cityName: rosterRow.city || undefined,
    });

    if (!resolved.locationId) {
      results.push({
        row: rowNumber,
        name: rosterRow.name,
        status: "unresolved_location",
        detail: `could not match country "${rosterRow.country}"${
          rosterRow.province ? ` / province "${rosterRow.province}"` : ""
        }${rosterRow.city ? ` / city "${rosterRow.city}"` : ""}`,
        rawRow: {
          name: rosterRow.name,
          email: rosterRow.email || undefined,
          phone: rosterRow.phone || undefined,
          occupation: rosterRow.occupation || undefined,
          company: rosterRow.company || undefined,
        },
      });
      continue;
    }

    const { invitationId, rawCode } = await createInvitation({
      communityId,
      createdByUserId,
      email: rosterRow.email || undefined,
      prefillData: {
        displayName: rosterRow.name,
        phone: rosterRow.phone || undefined,
        occupation: rosterRow.occupation || undefined,
        companyOrIndustry: rosterRow.company || undefined,
        locationId: resolved.locationId,
        locationMatchedAt: resolved.matched,
      },
    });

    invitedCount++;
    results.push({
      row: rowNumber,
      name: rosterRow.name,
      status: "invited",
      invitationId,
      rawCode,
    });
  }

  return { communityId, results, invitedCount };
}
