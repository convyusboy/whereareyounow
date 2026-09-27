import Link from "next/link";
import { listCommunityConfigs } from "@/lib/community/config";

export default function LandingPage() {
  const communities = listCommunityConfigs();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Lentera</h1>
        <p className="mt-2 text-neutral-500">
          A community directory for SMA Taruna Nusantara angkatan 19 — see where everyone
          lives now, and stay in touch.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/map"
          className="rounded border border-neutral-300 px-4 py-2 text-center font-medium"
        >
          See where everyone is
        </Link>
        {communities.map((c) => (
          <Link
            key={c.slug}
            href={`/register/${c.slug}`}
            className="rounded bg-neutral-900 px-4 py-2 text-center text-white"
          >
            I have an invitation code
          </Link>
        ))}
        <Link href="/login" className="rounded border border-neutral-300 px-4 py-2 text-center">
          Sign in
        </Link>
      </div>

      <Link href="/privacy" className="text-center text-sm text-neutral-400 underline">
        Privacy policy
      </Link>
    </main>
  );
}
