import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "vg_session";
const PUBLIC_PATHS = ["/login"];

/**
 * Edge-runtime gate: bounces unauthenticated requests to /login and keeps
 * client sessions out of the internal app (and vice versa). This is
 * defense-in-depth — the same checks also run per-page via
 * requireInternalSession/requireClientSession in src/lib/access.ts, so a
 * bug here doesn't become the only thing standing between a client account
 * and internal data.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;
  let globalRole: string | null = null;

  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      globalRole = typeof payload.globalRole === "string" ? payload.globalRole : null;
    } catch {
      globalRole = null;
    }
  }

  if (!globalRole) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isInternal = globalRole === "admin" || globalRole === "pm" || globalRole === "team_member";
  const isPortalPath = pathname.startsWith("/portal");

  if (isInternal && isPortalPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }
  if (!isInternal && !isPortalPath && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
