import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; community?: string }>;
}) {
  const { email, community } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-neutral-500">
          We&apos;ll email you a link to sign in — no password needed.
        </p>
      </div>
      <LoginForm defaultEmail={email} communitySlug={community} />
    </main>
  );
}
