import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAuditLogPage() {
  const supabase = createAdminClient();
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", DEFAULT_COMMUNITY_SLUG)
    .single();

  const { data: events } = await supabase
    .from("audit_events")
    .select("*")
    .or(`community_id.eq.${community!.id},community_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2">When</th>
            <th className="py-2">Entity</th>
            <th className="py-2">Action</th>
            <th className="py-2">Actor</th>
          </tr>
        </thead>
        <tbody>
          {events?.map((e) => (
            <tr key={e.id} className="border-b border-neutral-100">
              <td className="py-2">{new Date(e.created_at).toLocaleString()}</td>
              <td className="py-2">
                {e.entity_type}
                {e.entity_id ? ` (${e.entity_id.slice(0, 8)})` : ""}
              </td>
              <td className="py-2">{e.action}</td>
              <td className="py-2 font-mono text-xs">{e.actor_user_id?.slice(0, 8) ?? "system"}</td>
            </tr>
          ))}
          {events?.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-neutral-400">
                No audit events yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
