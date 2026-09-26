import { NewInvitationForm } from "./NewInvitationForm";

export default function NewInvitationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New invitation</h1>
      <p className="text-sm text-neutral-500">
        The invitation code is shown once, right here — only its hash is stored. Copy it now
        to send to the invitee manually.
      </p>
      <NewInvitationForm />
    </div>
  );
}
