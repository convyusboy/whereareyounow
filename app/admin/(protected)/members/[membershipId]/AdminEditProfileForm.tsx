"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  membershipId: string;
  initialValues: {
    displayName: string;
    occupation: string;
    companyOrIndustry: string;
    bio: string;
    education: string;
  };
  onCancel: () => void;
}

export function AdminEditProfileForm({ membershipId, initialValues, onCancel }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [occupation, setOccupation] = useState(initialValues.occupation);
  const [companyOrIndustry, setCompanyOrIndustry] = useState(initialValues.companyOrIndustry);
  const [bio, setBio] = useState(initialValues.bio);
  const [education, setEducation] = useState(initialValues.education);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/members/${membershipId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          occupation: occupation || undefined,
          companyOrIndustry: companyOrIndustry || undefined,
          bio: bio || undefined,
          education: education || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Could not save changes");
        return;
      }
      router.refresh();
      onCancel();
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-neutral-200 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Name</span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Occupation</span>
        <input
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Company / industry</span>
        <input
          value={companyOrIndustry}
          onChange={(e) => setCompanyOrIndustry(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Education</span>
        <input
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
