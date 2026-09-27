"use client";

import { useState } from "react";

export function NewInvitationForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Could not create invitation");
        return;
      }
      setResult({ code: data.code });
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-3 rounded border border-green-300 bg-green-50 p-4">
        <p className="text-sm text-green-900">Invitation created. Send this code manually:</p>
        <code className="rounded bg-white px-3 py-2 font-mono text-lg tracking-wider">
          {result.code}
        </code>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create invitation"}
      </button>
    </form>
  );
}
