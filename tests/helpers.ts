import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

// Shared helpers for integration tests. These hit the REAL database
// configured in .env.local — keep that pointed at the testing project, never
// the real one. Every fixture created here is torn down by the caller.

export async function createThrowawayUser(emailPrefix: string) {
  const supabase = createAdminClient();
  const email = `${emailPrefix}.${crypto.randomBytes(6).toString("hex")}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomBytes(18).toString("base64"),
    email_confirm: true,
  });
  if (error) throw error;
  return { userId: data.user.id, email };
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getLenteraCommunityId(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", "lentera")
    .single();
  if (error) throw error;
  return data.id;
}
