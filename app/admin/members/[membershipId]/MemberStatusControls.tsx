"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TRANSITIONS: Record<string, { label: string; status: string }[]> = {
  pending: [
    { label: "Approve", status: "approved" },
    { label: "Reject", status: "rejected" },
  ],
  approved: [{ label: "Suspend", status: "suspended" }],
  suspended: [{ label: "Reactivate", status: "approved" }],
  rejected: [{ label: "Approve", status: "approved" }],
  deleted: [],
};

export function MemberStatusControls({
  membershipId,
  currentStatus,
}: {
  membershipId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(status: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  const options = TRANSITIONS[currentStatus] ?? [];
  if (options.length === 0) return null;

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.status}
          disabled={pending}
          onClick={() => updateStatus(opt.status)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
