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

  // Note: Auth protection is handled client-side by RoleGuard in (dashboard)/layout.tsx
  // Middleware cannot access localStorage, so we don't check auth state here
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
