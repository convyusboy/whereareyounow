import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const [{ count: pendingMembers }, { count: pendingInvitations }] = await Promise.all([
    supabase
      .from("community_memberships")
      .select("id", { count: "exact", head: true })
      .eq("community_id", community!.id)
      .eq("status", "pending"),
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("community_id", community!.id)
      .eq("status", "pending"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/members?status=pending"
          className="rounded border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <div className="text-3xl font-semibold">{pendingMembers ?? 0}</div>
          <div className="text-sm text-neutral-500">Members awaiting approval</div>
        </Link>
        <Link
          href="/admin/invitations"
          className="rounded border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <div className="text-3xl font-semibold">{pendingInvitations ?? 0}</div>
          <div className="text-sm text-neutral-500">Unredeemed invitations</div>
        </Link>
      </div>
    </div>
  );
}
