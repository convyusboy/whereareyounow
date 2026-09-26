import { z } from "zod";

// Admin "add member" form (PRD 7.9): auto-approved on save per the Phase 1
// decision, since the admin manually entering the data is itself the
// verification step.
export const adminCreateMemberSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(120),
  occupation: z.string().trim().max(160).optional(),
  companyOrIndustry: z.string().trim().max(160).optional(),
  locationId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}$/).transform((value) => `${value}-01`),
});

export const adminUpdateMemberStatusSchema = z.object({
  status: z.enum(["pending", "approved", "suspended", "rejected", "deleted"]),
});

export type AdminCreateMemberInput = z.infer<typeof adminCreateMemberSchema>;
