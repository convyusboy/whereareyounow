import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function AccountPage() {
  await requireMember(DEFAULT_COMMUNITY_SLUG);
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="text-sm">
        Signed in as <strong>{user?.email}</strong>
      </p>
      <DeleteAccountButton />
    </div>
  );
}
