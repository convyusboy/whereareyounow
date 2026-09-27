"use client";

import { useState } from "react";
import type { RosterImportRowResult } from "@/lib/csv/rosterImport";
import { RetryRowForm } from "./RetryRowForm";

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RosterImportRowResult[] | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setResults(data.results);
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!file || submitting}
          className="w-fit rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Importing…" : "Import"}
        </button>
      </form>

      {results && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2">Row</th>
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Detail / code</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.row} className="border-b border-neutral-100 align-top">
                <td className="py-2">{r.row}</td>
                <td className="py-2">{r.name}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 font-mono text-xs">
                  {r.rawCode ?? r.detail ?? ""}
                  {r.status === "unresolved_location" && r.rawRow && (
                    <RetryRowForm
                      result={r}
                      onResolved={(updated) =>
                        setResults((prev) => prev!.map((row, idx) => (idx === i ? updated : row)))
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
