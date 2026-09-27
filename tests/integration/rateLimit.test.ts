import { afterEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { checkRateLimit, recordAttempt } from "@/lib/ratelimit/attempts";
import { createAdminClient } from "@/lib/supabase/admin";

const identifiers: string[] = [];

afterEach(async () => {
  const supabase = createAdminClient();
  await Promise.all(
    identifiers.splice(0).map((id) => supabase.from("login_attempts").delete().eq("identifier", id))
  );
});

describe("rate limiting", () => {
  it("allows attempts under the configured max, then blocks once exceeded", async () => {
    const identifier = `test-${crypto.randomBytes(6).toString("hex")}@example.com`;
    identifiers.push(identifier);
    const max = Number(process.env.LOGIN_ATTEMPT_MAX ?? 5);

    for (let i = 0; i < max; i++) {
      const { allowed } = await checkRateLimit(identifier, "admin_login");
      expect(allowed).toBe(true);
      await recordAttempt(identifier, "admin_login");
    }

    const { allowed, remaining } = await checkRateLimit(identifier, "admin_login");
    expect(allowed).toBe(false);
    expect(remaining).toBe(0);
  });

  it("keeps attempt types independent of each other", async () => {
    const identifier = `test-${crypto.randomBytes(6).toString("hex")}@example.com`;
    identifiers.push(identifier);
    const max = Number(process.env.LOGIN_ATTEMPT_MAX ?? 5);

    for (let i = 0; i < max; i++) {
      await recordAttempt(identifier, "admin_login");
    }

    const { allowed } = await checkRateLimit(identifier, "invitation_redeem");
    expect(allowed).toBe(true);
  });
});
