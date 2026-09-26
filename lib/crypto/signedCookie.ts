import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Signs an opaque value for storage in a short-lived httpOnly cookie, so the
// client can carry a reference (e.g. an invitation id) between requests
// without being able to substitute a different one of their choosing.
function sign(value: string): string {
  const secret = process.env.IDENTIFIER_HASH_SECRET;
  if (!secret) throw new Error("IDENTIFIER_HASH_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function signValue(value: string): string {
  return `${value}.${sign(value)}`;
}

export function verifySignedValue(signedValue: string | undefined): string | null {
  if (!signedValue) return null;
  const separatorIndex = signedValue.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const value = signedValue.slice(0, separatorIndex);
  const providedSignature = signedValue.slice(separatorIndex + 1);
  const expectedSignature = sign(value);

  const a = Buffer.from(providedSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return value;
}
