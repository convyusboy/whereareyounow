import { z } from "zod";

export const visibilitySchema = z.enum(["members", "admin_only", "hidden"]);
export type FieldVisibility = z.infer<typeof visibilitySchema>;

export const onboardingProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  // Required per PRD section 16 item 6 (only bio/education/company are optional).
  occupation: z.string().trim().min(1).max(160),
  companyOrIndustry: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1000).optional(),
  education: z.string().trim().max(300).optional(),
  visibility: z
    .object({
      occupation: visibilitySchema.optional(),
      companyOrIndustry: visibilitySchema.optional(),
      bio: visibilitySchema.optional(),
      education: visibilitySchema.optional(),
    })
    .partial()
    .default({}),
});

export const onboardingLocationSchema = z.object({
  locationId: z.string().uuid(),
  // Month/year the current location became effective (PRD 7.2); day is fixed to the 1st.
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "expected YYYY-MM")
    .transform((value) => `${value}-01`),
});

export const onboardingSchema = onboardingProfileSchema.merge(onboardingLocationSchema);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
