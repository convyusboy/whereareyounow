import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["pending", "approved", "suspended", "rejected", "deleted"] as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  let query = supabase
    .from("community_memberships")
    .select("id, status, role, created_at, member_profiles(display_name, occupation)")
    .eq("community_id", community!.id)
    .order("created_at", { ascending: false });

  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    query = query.eq("status", status as (typeof STATUSES)[number]);
  }
  if (q) query = query.ilike("member_profiles.display_name", `%${q}%`);

  const { data: members } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <Link href="/admin/members/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Add member
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/admin/members"
          className={!status ? "font-semibold" : "text-neutral-500"}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/members?status=${s}`}
            className={status === s ? "font-semibold" : "text-neutral-500"}
          >
            {s}
          </Link>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2">Name</th>
            <th className="py-2">Occupation</th>
            <th className="py-2">Status</th>
            <th className="py-2">Role</th>
            <th className="py-2">Joined</th>
          </tr>
        </thead>
        <tbody>
          {members?.map((m) => (
            <tr key={m.id} className="border-b border-neutral-100">
              <td className="py-2">
                <Link href={`/admin/members/${m.id}`} className="underline">
                  {m.member_profiles?.display_name ?? "(no profile yet)"}
                </Link>
              </td>
              <td className="py-2">{m.member_profiles?.occupation ?? "—"}</td>
              <td className="py-2">{m.status}</td>
              <td className="py-2">{m.role}</td>
              <td className="py-2">{new Date(m.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {members?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-neutral-400">
                No members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
