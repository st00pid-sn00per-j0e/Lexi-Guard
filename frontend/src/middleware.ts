import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// HttpOnly access token cookie set by backend
const AUTH_COOKIE = "lexiguard_access_token";

export function middleware(request: NextRequest) {
  const isLoggedIn = !!request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isAppRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/contracts") ||
    request.nextUrl.pathname.startsWith("/analysis") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/translation") ||
    request.nextUrl.pathname.startsWith("/voice") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/notifications") ||
    request.nextUrl.pathname.startsWith("/risk");

  if (isAppRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }



  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/analysis/:path*",
    "/analytics/:path*",
    "/translation/:path*",
    "/voice/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/risk/:path*",
    "/login",
    "/signup",
  ],
};
