import { describe, expect, it } from "vitest";
import { codeDisplayHint, generateInvitationCode, hashIdentifier } from "@/lib/crypto/identifierHash";

describe("generateInvitationCode", () => {
  it("produces XXXX-XXXX-XXXX using only unambiguous characters", () => {
    const code = generateInvitationCode();
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("generates different codes across calls (no collisions in a small sample)", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateInvitationCode()));
    expect(codes.size).toBe(200);
  });
});

describe("hashIdentifier", () => {
  it("is deterministic for the same input", () => {
    expect(hashIdentifier("ABCD-EFGH-1234")).toBe(hashIdentifier("ABCD-EFGH-1234"));
  });

  it("normalizes case and surrounding whitespace before hashing", () => {
    expect(hashIdentifier("abcd-efgh-1234")).toBe(hashIdentifier("  ABCD-EFGH-1234  "));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashIdentifier("AAAA-AAAA-AAAA")).not.toBe(hashIdentifier("BBBB-BBBB-BBBB"));
  });

  it("returns a 64-character hex string (SHA-256)", () => {
    expect(hashIdentifier("test")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("codeDisplayHint", () => {
  it("returns only the last 4 characters", () => {
    expect(codeDisplayHint("ABCD-EFGH-1234")).toBe("1234");
  });
});
