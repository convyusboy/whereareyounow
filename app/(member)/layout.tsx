import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireMember } from "@/lib/auth/roles";
import { SignOutButton } from "./SignOutButton";

const NAV = [
  { href: "/profile", label: "My profile" },
  { href: "/directory", label: "Directory" },
  { href: "/account", label: "Account" },
];

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // Enforced server-side on every request, not just here — see requireMember
  // (PRD 7.8's "not frontend-only" requirement applies to member routes too).
  await requireMember(DEFAULT_COMMUNITY_SLUG);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-lg font-semibold">Lentera</span>
        <SignOutButton />
      </header>
      <nav className="mb-8 flex gap-4 border-b border-neutral-200 pb-2 text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="text-neutral-600 hover:text-neutral-900">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
