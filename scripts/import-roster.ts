// One-off CLI for the real Lentera roster load (Phase 1 plan, build step 13).
// Usage: pnpm tsx scripts/import-roster.ts <path-to-roster.csv> [--community=lentera]
//
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// IDENTIFIER_HASH_SECRET in the environment (e.g. via `pnpm dlx dotenv -e
// .env.local -- pnpm tsx scripts/import-roster.ts ...`).
//
// Expected CSV columns: name, email, phone, country, province, city, occupation, company
// (see lib/validation/roster.ts). Re-running with a corrected file is safe —
// rows whose email already has an invitation are skipped, not duplicated.

import { readFileSync, writeFileSync } from "fs";
import { createAdminClient } from "@/lib/supabase/admin";
import { importRosterCsv } from "@/lib/csv/rosterImport";

async function main() {
  const [csvPath, ...rest] = process.argv.slice(2);
  if (!csvPath) {
    console.error("Usage: pnpm tsx scripts/import-roster.ts <path-to-roster.csv> [--community=lentera]");
    process.exit(1);
  }

  const communityFlag = rest.find((arg) => arg.startsWith("--community="));
  const communitySlug = communityFlag ? communityFlag.split("=")[1] : "lentera";

  const supabase = createAdminClient();
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", communitySlug)
    .single();
  if (communityError || !community) {
    console.error(`Community "${communitySlug}" not found. Has it been seeded yet?`);
    process.exit(1);
  }

  // A platform-admin auth user must already exist to attribute the import to;
  // fall back to the first platform admin found.
  const { data: admin, error: adminError } = await supabase
    .from("platform_admins")
    .select("user_id")
    .limit(1)
    .maybeSingle();
  if (adminError || !admin) {
    console.error("No platform admin found to attribute this import to. Create one first.");
    process.exit(1);
  }

  const csvContent = readFileSync(csvPath, "utf-8");
  const summary = await importRosterCsv(csvContent, community.id, admin.user_id);

  const outPath = csvPath.replace(/\.csv$/i, "") + `.import-result.csv`;
  const lines = ["row,name,status,detail,invitation_code"];
  for (const r of summary.results) {
    lines.push(
      [r.row, r.name, r.status, r.detail ?? "", r.rawCode ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  }
  writeFileSync(outPath, lines.join("\n"));

  console.log(`Processed ${summary.results.length} rows, invited ${summary.invitedCount}.`);
  console.log(`Full result (including generated codes to distribute manually) written to: ${outPath}`);

  const problems = summary.results.filter((r) => r.status !== "invited" && r.status !== "skipped_duplicate");
  if (problems.length > 0) {
    console.log(`\n${problems.length} row(s) need attention:`);
    for (const p of problems) {
      console.log(`  row ${p.row} (${p.name}): ${p.status}${p.detail ? ` — ${p.detail}` : ""}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
