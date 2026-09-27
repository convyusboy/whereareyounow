import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { DirectoryBrowser } from "./DirectoryBrowser";

const STATUS_MESSAGE: Record<string, string> = {
  pending: "The directory unlocks once your account is approved.",
  suspended: "Your account has been suspended. Contact an admin if you think this is a mistake.",
  rejected: "Your account request was not approved.",
  deleted: "This account has been removed.",
};

export default async function DirectoryPage() {
  const membership = await requireMember(DEFAULT_COMMUNITY_SLUG);

  if (membership.status !== "approved") {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {STATUS_MESSAGE[membership.status] ?? "Your account status doesn't allow access yet."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Directory</h1>
        <p className="text-sm text-neutral-500">
          Fellow Lentera members. Fields a member has marked private aren&apos;t shown here.
        </p>
      </div>
      <DirectoryBrowser />
    </div>
  );
}
