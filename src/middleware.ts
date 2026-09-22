import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("kyra_session")?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isPublicWebhook = pathname.startsWith("/api/integrations/meta");
  const isApiAuth = pathname.startsWith("/api/auth/login");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes("favicon.ico") ||
    pathname.includes(".");

  if (isPublicAsset || isApiAuth || isPublicWebhook) {
    return NextResponse.next();
  }

  // Always allow auth pages (login) to render cleanly without redirect loops
  if (isAuthPage) {
    return NextResponse.next();
  }

  // If not logged in and visiting protected page/endpoint
  if (!sessionCookie || sessionCookie.trim() === "") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
