"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRevoke() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/invitations/${invitationId}`, { method: "PATCH" });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="text-sm text-red-600 underline disabled:opacity-50"
    >
      Revoke
    </button>
  );
}
