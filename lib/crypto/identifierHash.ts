import "server-only";
import { createHmac, randomBytes } from "crypto";

// Deterministic HMAC-SHA256 hashing for invitation codes (and future NIM
// identifiers): uniqueness enforcement needs an equality-matchable hash,
// which a randomly-salted algorithm like bcrypt can't provide. Security
// rests on high-entropy generated codes plus rate limiting, not on the
// hash being unguessable in isolation. See PRD section 9's closing note and
// the Phase 1 plan's "Decisions locked" list.
export function hashIdentifier(rawValue: string): string {
  const secret = process.env.IDENTIFIER_HASH_SECRET;
  if (!secret) {
    throw new Error("IDENTIFIER_HASH_SECRET is not set");
  }
  return createHmac("sha256", secret).update(rawValue.trim().toUpperCase()).digest("hex");
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // unambiguous: no I/L/O/0/1

// Generates a high-entropy invitation code, formatted for easy manual
// transcription, e.g. "7K4M-QRTX-9F2B".
export function generateInvitationCode(): string {
  const bytes = randomBytes(12);
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

export function codeDisplayHint(rawCode: string): string {
  return rawCode.slice(-4);
}
