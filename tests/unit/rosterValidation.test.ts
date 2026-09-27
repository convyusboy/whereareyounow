import { describe, expect, it } from "vitest";
import { rosterRowSchema } from "@/lib/validation/roster";

describe("rosterRowSchema", () => {
  it("accepts a fully-populated row", () => {
    const result = rosterRowSchema.safeParse({
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "+62812345678",
      country: "Indonesia",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      occupation: "Software Engineer",
      company: "Gojek",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a row with only the required fields", () => {
    const result = rosterRowSchema.safeParse({
      name: "Budi Santoso",
      country: "Indonesia",
      email: "",
      phone: "",
      province: "",
      city: "",
      occupation: "",
      company: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a name", () => {
    const result = rosterRowSchema.safeParse({ name: "", country: "Indonesia" });
    expect(result.success).toBe(false);
  });

  it("rejects a row missing a country", () => {
    const result = rosterRowSchema.safeParse({ name: "Budi Santoso", country: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = rosterRowSchema.safeParse({
      name: "Budi Santoso",
      country: "Indonesia",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});
