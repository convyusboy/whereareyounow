// Placeholder privacy policy (PRD section 16, decision #10). Reflects the
// privacy model in PRD section 5, but has NOT been reviewed by a lawyer or
// the community's founders — replace before any public launch.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Privacy policy (draft)</h1>
      <p className="mt-2 text-sm font-medium text-amber-700">
        This is a placeholder draft, not a reviewed legal document. It should be reviewed before
        Lentera is opened up beyond a closed test group.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900">What we collect</h2>
          <p>
            When you join Lentera, we ask for your current country, and — if you&apos;re in
            Indonesia — your province and city. We also ask for optional information you choose
            to share: occupation, company or industry, education, a short bio, and a profile
            photo. We do not ask for your exact address.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">Who can see what</h2>
          <p>
            Anyone visiting the public site can see how many members live in a given country,
            province, or city — never names, jobs, or any other personal detail. Once you sign
            in as an approved member, other approved members can see the profile fields you
            choose to make visible to them. Fields you mark &quot;visible only to admins&quot;
            or leave as &quot;not provided&quot; stay hidden from other members. Locations with
            very few members are grouped together on the public map so a single person in a
            small town can&apos;t be identified from the count alone.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">Account approval</h2>
          <p>
            New accounts are reviewed by a community admin before they become visible to other
            members. Admins can see full account and profile details as part of that review and
            for ongoing moderation.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">Your controls</h2>
          <p>
            You can update your location and profile information at any time, control the
            visibility of each optional field, and ask an admin to correct inaccurate
            information or delete your account. Deleting your account removes you from all
            public and member-facing views; we keep a minimal audit record of the deletion
            itself.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-neutral-900">Contact</h2>
          <p>Questions about this policy or your data can be sent to a community admin.</p>
        </section>
      </div>
    </main>
  );
}
