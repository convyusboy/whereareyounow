import { z } from "zod";

// One row of the Lentera roster CSV: name/contact, city/country, occupation/company
// (see the Phase 1 plan's "Seed data" section). Location fields are free text as
// they appear in the roster; lib/csv/rosterImport.ts resolves them against the
// seeded `locations` table and flags rows it can't match instead of dropping them.
export const rosterRowSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().min(1),
  province: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  occupation: z.string().trim().optional().or(z.literal("")),
  company: z.string().trim().optional().or(z.literal("")),
});

export type RosterRow = z.infer<typeof rosterRowSchema>;
