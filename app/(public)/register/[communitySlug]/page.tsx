import { notFound } from "next/navigation";
import { getCommunityConfig } from "@/lib/community/config";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ communitySlug: string }>;
}) {
  const { communitySlug } = await params;
  const community = getCommunityConfig(communitySlug);
  if (!community) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{community.name}</h1>
        <p className="text-sm text-neutral-500">{community.shortDescription}</p>
      </div>
      <RegisterForm communitySlug={community.slug} />
    </main>
  );
}
