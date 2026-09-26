import Link from "next/link";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community/config";
import { requireCommunityAdmin } from "@/lib/auth/roles";
import { AdminSignOutButton } from "./AdminSignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/invitations", label: "Invitations" },
  { href: "/admin/import", label: "Import roster" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verified server-side here on every render — the dedicated /admin/login
  // route and middleware.ts's idle-timeout check are UX layers on top, not
  // substitutes for this (PRD 7.8).
  await requireCommunityAdmin(DEFAULT_COMMUNITY_SLUG);

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <span className="text-lg font-semibold">Lentera admin</span>
        <AdminSignOutButton />
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
