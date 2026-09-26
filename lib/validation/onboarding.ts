import { z } from "zod";

export const visibilitySchema = z.enum(["members", "admin_only", "hidden"]);

export const onboardingProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  occupation: z.string().trim().max(160).optional(),
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
