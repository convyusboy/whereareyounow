"use client";

import { useState } from "react";
import { AdminEditProfileForm } from "./AdminEditProfileForm";

interface Props {
  membershipId: string;
  displayName: string;
  occupation: string | null;
  companyOrIndustry: string | null;
  bio: string | null;
  education: string | null;
}

export function AdminProfileSection(props: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AdminEditProfileForm
        membershipId={props.membershipId}
        initialValues={{
          displayName: props.displayName,
          occupation: props.occupation ?? "",
          companyOrIndustry: props.companyOrIndustry ?? "",
          bio: props.bio ?? "",
          education: props.education ?? "",
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {props.occupation && (
          <>
            <dt className="text-neutral-500">Occupation</dt>
            <dd>{props.occupation}</dd>
          </>
        )}
        {props.companyOrIndustry && (
          <>
            <dt className="text-neutral-500">Company / industry</dt>
            <dd>{props.companyOrIndustry}</dd>
          </>
        )}
        {props.education && (
          <>
            <dt className="text-neutral-500">Education</dt>
            <dd>{props.education}</dd>
          </>
        )}
        {props.bio && (
          <>
            <dt className="text-neutral-500">Bio</dt>
            <dd>{props.bio}</dd>
          </>
        )}
      </dl>
      <button onClick={() => setEditing(true)} className="w-fit text-sm underline">
        Edit profile fields
      </button>
    </div>
  );
}
