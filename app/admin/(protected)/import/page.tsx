import { ImportForm } from "./ImportForm";

export default function AdminImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Import roster</h1>
      <p className="text-sm text-neutral-500">
        CSV columns: name, email, phone, country, province, city, occupation, company. Rows
        whose email already has an invitation are skipped, not duplicated — safe to re-run
        with a corrected file. Unresolved locations are flagged, not dropped.
      </p>
      <ImportForm />
    </div>
  );
}
