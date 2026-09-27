import { describe, expect, it } from "vitest";
import { onboardingProfileSchema } from "@/lib/validation/onboarding";

describe("onboardingProfileSchema", () => {
  it("requires a non-empty occupation (PRD section 16 item 6)", () => {
    const result = onboardingProfileSchema.safeParse({
      displayName: "Budi Santoso",
      occupation: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a row with only displayName and occupation", () => {
    const result = onboardingProfileSchema.safeParse({
      displayName: "Budi Santoso",
      occupation: "Software Engineer",
    });
    expect(result.success).toBe(true);
  });

  it("defaults visibility to an empty object when omitted", () => {
    const result = onboardingProfileSchema.parse({
      displayName: "Budi Santoso",
      occupation: "Software Engineer",
    });
    expect(result.visibility).toEqual({});
  });

  it("rejects an invalid visibility value", () => {
    const result = onboardingProfileSchema.safeParse({
      displayName: "Budi Santoso",
      occupation: "Software Engineer",
      visibility: { occupation: "everyone" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid visibility value", () => {
    const result = onboardingProfileSchema.safeParse({
      displayName: "Budi Santoso",
      occupation: "Software Engineer",
      visibility: { occupation: "admin_only" },
    });
    expect(result.success).toBe(true);
  });
});
