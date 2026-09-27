import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberStatusControls } from "./MemberStatusControls";
import { AdminProfileSection } from "./AdminProfileSection";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const supabase = createAdminClient();

  const [{ data: membership }, { data: profile }, { data: locations }, { data: auditEvents }] =
    await Promise.all([
      supabase.from("community_memberships").select("*").eq("id", membershipId).maybeSingle(),
      supabase.from("member_profiles").select("*").eq("membership_id", membershipId).maybeSingle(),
      supabase
        .from("member_locations")
        .select("*, locations(*)")
        .eq("membership_id", membershipId)
        .order("effective_from", { ascending: false }),
      supabase
        .from("audit_events")
        .select("*")
        .eq("entity_type", "membership")
        .eq("entity_id", membershipId)
        .order("created_at", { ascending: false }),
    ]);

  if (!membership) notFound();

  const currentLocation = locations?.find((l) => l.is_current);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{profile?.display_name ?? "(no profile yet)"}</h1>
        <MemberStatusControls membershipId={membership.id} currentStatus={membership.status} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-neutral-500">Status</dt>
        <dd>{membership.status}</dd>
        <dt className="text-neutral-500">Role</dt>
        <dd>{membership.role}</dd>
        {currentLocation?.locations && (
          <>
            <dt className="text-neutral-500">Location</dt>
            <dd>
              {[
                currentLocation.locations.city_name,
                currentLocation.locations.province_name,
                currentLocation.locations.country_name,
              ]
                .filter(Boolean)
                .join(", ")}
              {" · since "}
              {currentLocation.effective_from}
            </dd>
          </>
        )}
      </dl>

      <AdminProfileSection
        membershipId={membership.id}
        displayName={profile?.display_name ?? ""}
        occupation={profile?.occupation ?? null}
        companyOrIndustry={profile?.company_or_industry ?? null}
        bio={profile?.bio ?? null}
        education={profile?.education ?? null}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">Audit history</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {auditEvents?.map((event) => (
            <li key={event.id} className="text-neutral-600">
              {new Date(event.created_at).toLocaleString()} — {event.action}
            </li>
          ))}
          {auditEvents?.length === 0 && <li className="text-neutral-400">No history yet.</li>}
        </ul>
      </div>
    </div>
  );
}
