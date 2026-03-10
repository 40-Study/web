/**
 * Next.js middleware for route protection
 */

import { NextRequest, NextResponse } from "next/server";

// Routes accessible without authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/otp",
  "/forgot-password",
  "/reset-password",
  "/about",
];

// Routes that require specific roles (checked client-side)
const ADMIN_ROUTES = ["/admin"];
const TEACHER_ROUTES = ["/classes", "/classroom"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (preferred) or check localStorage marker
  const token = request.cookies.get("access_token")?.value;
  const hasSession = request.cookies.get("has_session")?.value === "true";

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // No authentication → redirect to login
  if (!token && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};
