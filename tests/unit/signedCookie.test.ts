import { describe, expect, it } from "vitest";
import { signValue, verifySignedValue } from "@/lib/crypto/signedCookie";

describe("signValue / verifySignedValue", () => {
  it("round-trips a value through sign and verify", () => {
    const signed = signValue("some-invitation-id");
    expect(verifySignedValue(signed)).toBe("some-invitation-id");
  });

  it("rejects a tampered value", () => {
    const signed = signValue("some-invitation-id");
    const tampered = signed.replace("some-invitation-id", "different-id-!!!!");
    expect(verifySignedValue(tampered)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const signed = signValue("some-invitation-id");
    const tampered = signed.slice(0, -1) + (signed.at(-1) === "0" ? "1" : "0");
    expect(verifySignedValue(tampered)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(verifySignedValue(undefined)).toBeNull();
  });

  it("returns null for a value with no signature separator", () => {
    expect(verifySignedValue("not-a-signed-value")).toBeNull();
  });
});
