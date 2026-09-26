import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { RevokeInvitationButton } from "./RevokeInvitationButton";

export default async function AdminInvitationsPage() {
  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, code_display_hint, status, created_at, prefill_data")
    .eq("community_id", community!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invitations</h1>
        <Link
          href="/admin/invitations/new"
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
        >
          New invitation
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2">Email / name</th>
            <th className="py-2">Code ends in</th>
            <th className="py-2">Status</th>
            <th className="py-2">Created</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {invitations?.map((inv) => (
            <tr key={inv.id} className="border-b border-neutral-100">
              <td className="py-2">
                {inv.email ?? (inv.prefill_data as { displayName?: string } | null)?.displayName ?? "—"}
              </td>
              <td className="py-2 font-mono">···{inv.code_display_hint}</td>
              <td className="py-2">{inv.status}</td>
              <td className="py-2">{new Date(inv.created_at).toLocaleDateString()}</td>
              <td className="py-2">
                {inv.status === "pending" && <RevokeInvitationButton invitationId={inv.id} />}
              </td>
            </tr>
          ))}
          {invitations?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-neutral-400">
                No invitations yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
