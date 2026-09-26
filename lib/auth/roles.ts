import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getMembership, getSessionUser, isCommunityAdmin, isPlatformAdmin } from "./session";

// Page/layout guards: redirect on failure. Every admin/member page and layout
// must call the matching guard itself — middleware.ts also gates these routes
// for a fast redirect, but per PRD 7.8 ("must not rely on frontend-only
// permission checks... verify on the server on every request") the
// server-side check here is the one that actually matters.

export async function requireMember(communitySlug: string) {
  const membership = await getMembership(communitySlug);
  if (!membership) {
    redirect(`/login?community=${communitySlug}`);
  }
  return membership;
}

export async function requireCommunityAdmin(communitySlug: string) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!(await isCommunityAdmin(communitySlug))) redirect("/admin/login");
  return user;
}

export async function requirePlatformAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!(await isPlatformAdmin())) redirect("/admin/login");
  return user;
}

// Route Handler guards: return a JSON response instead of redirecting, since
// these are called from client-side fetch()/form actions, not navigated to.
export async function requireCommunityAdminApi(communitySlug: string) {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  }
  if (!(await isCommunityAdmin(communitySlug))) {
    return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

export async function requireMemberApi(communitySlug: string) {
  const membership = await getMembership(communitySlug);
  if (!membership) {
    return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  }
  return { membership } as const;
}
