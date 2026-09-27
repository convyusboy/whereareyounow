import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG, listCommunityConfigs } from "@/lib/community/config";
import { getPublicDistribution } from "@/lib/db/queries/publicStats";
import { MapExplorer } from "./MapExplorer";

export const dynamic = "force-dynamic";

// Homepage for every visitor, public or member (PRD Journey A: "Visitor
// opens Lentera... the site shows a world map with aggregate counts").
// Login/registration are deliberately small corner links, not the page's
// focal point — the map is.
export default async function LandingPage() {
  const communities = listCommunityConfigs();
  const distribution = await getPublicDistribution(DEFAULT_COMMUNITY_SLUG);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lentera</h1>
          <p className="text-sm text-neutral-500">
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
        <p className="text-sm text-neutral-400">No approved members yet.</p>
      ) : (
        <MapExplorer distribution={distribution} />
      )}

      <Link href="/privacy" className="mt-8 block text-center text-xs text-neutral-400 underline">
        Privacy policy
      </Link>
    </main>
  );
}
