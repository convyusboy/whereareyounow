import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-neutral-500">Lentera community administration</p>
      </div>
      {reason === "idle" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          You were signed out after a period of inactivity.
        </p>
      )}
      <AdminLoginForm />
    </main>
  );
}
