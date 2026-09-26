import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const MEMBER_PATH_PREFIXES = ["/onboarding", "/profile", "/account"];
const ADMIN_ACTIVITY_COOKIE = "admin_last_activity";
const IDLE_TIMEOUT_MINUTES = Number(process.env.ADMIN_SESSION_IDLE_TIMEOUT_MINUTES ?? 20);

// Route-group gating + the admin idle-timeout check (PRD 7.8: admin sessions
// must have shorter idle timeouts than regular member sessions). This is a
// fast UX-level redirect only — every admin page/layout and API route still
// calls requireCommunityAdmin()/requireCommunityAdminApi() itself, since a
// frontend/middleware-only check is explicitly not sufficient (PRD 7.8).
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const lastActivity = request.cookies.get(ADMIN_ACTIVITY_COOKIE)?.value;
    if (lastActivity) {
      const idleMinutes = (Date.now() - Number(lastActivity)) / 60_000;
      if (idleMinutes > IDLE_TIMEOUT_MINUTES) {
        const redirectResponse = NextResponse.redirect(
          new URL("/admin/login?reason=idle", request.url)
        );
        redirectResponse.cookies.delete(ADMIN_ACTIVITY_COOKIE);
        return redirectResponse;
      }
    }

    response.cookies.set(ADMIN_ACTIVITY_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
    });
    return response;
  }

  if (MEMBER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
