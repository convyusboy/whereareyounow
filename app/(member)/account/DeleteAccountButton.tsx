"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/delete-account", { method: "POST" });
      if (!res.ok) {
        setError("Could not delete your account, please try again or contact an admin.");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="w-fit text-sm text-red-600 underline">
        Delete my account
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-red-300 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        This immediately removes you from the directory and public map, and clears your name,
        occupation, bio, and other profile fields. This can&apos;t be undone yourself — you&apos;d
        need to ask an admin to reinstate you. Are you sure?
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
