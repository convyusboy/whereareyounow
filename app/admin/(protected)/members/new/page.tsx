import { AddMemberForm } from "./AddMemberForm";

export default function AdminAddMemberPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add member</h1>
      <p className="text-sm text-neutral-500">
        Manually entering a member here is itself the verification step — the account is
        created and auto-approved immediately, with no separate review step.
      </p>
      <AddMemberForm />
    </div>
  );
}
