import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("kyra_session")?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth/login");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes("favicon.ico") ||
    pathname.includes(".");

  if (isPublicAsset || isApiAuth) {
    return NextResponse.next();
  }

  // If already logged in and visiting login page, redirect to home
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not logged in and visiting protected page, redirect to login
  if (!isAuthPage && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
