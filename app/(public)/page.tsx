import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG, listCommunityConfigs } from "@/lib/community/config";
import { getPublicDistribution } from "@/lib/db/queries/publicStats";
import { MapExplorer } from "./MapExplorer";

export const dynamic = "force-dynamic";

// Homepage for every visitor, public or member (PRD Journey A: "Visitor
// opens Lentera... the site shows a world map with aggregate counts").
// Login/registration are deliberately small corner links, not the page's
// focal point — the map fills the viewport instead.
export default async function LandingPage() {
  const communities = listCommunityConfigs();
  const distribution = await getPublicDistribution(DEFAULT_COMMUNITY_SLUG);

  return (
    <div className="flex flex-col">
      <header className="flex items-start justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold">Lentera</h1>
          <p className="text-xs text-neutral-500">
            Where SMA Taruna Nusantara angkatan 19 lives now.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <Link href="/login" className="underline">
            Sign in
          </Link>
          {communities.map((c) => (
            <Link key={c.slug} href={`/register/${c.slug}`} className="text-neutral-500 underline">
              I have an invitation code
            </Link>
          ))}
        </div>
      </header>

      {distribution.totalMembers === 0 ? (
        <p className="px-4 text-sm text-neutral-400">No approved members yet.</p>
      ) : (
        <MapExplorer distribution={distribution} />
      )}

      <Link href="/privacy" className="block px-4 py-6 text-center text-xs text-neutral-400 underline">
        Privacy policy
      </Link>
    </div>
  );
}
