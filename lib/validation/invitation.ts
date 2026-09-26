import { z } from "zod";

export const redeemInvitationSchema = z.object({
  communitySlug: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6)
    .max(20),
});

export const createInvitationSchema = z.object({
  email: z.string().trim().email().optional(),
  prefill: z
    .object({
      displayName: z.string().trim().max(120).optional(),
      occupation: z.string().trim().max(160).optional(),
      companyOrIndustry: z.string().trim().max(160).optional(),
      countryCode: z.string().trim().length(2).optional(),
      provinceCode: z.string().trim().max(10).optional(),
      cityCode: z.string().trim().max(10).optional(),
    })
    .optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
