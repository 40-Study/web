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

// Tên cookie httpOnly do backend set — khớp internal/handler/auth_handler.go
// (Login/RefreshToken: "accessToken" 15 phút, "rfToken" 24h).
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "rfToken";

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

  // H4: middleware trước đây là no-op hoàn toàn — token nằm ở cookie httpOnly
  // nên middleware ĐỌC ĐƯỢC qua request.cookies (không cần localStorage).
  // Chỉ kiểm tra SỰ TỒN TẠI của cookie, không verify chữ ký JWT — việc verify
  // và refresh vẫn do backend + api-client.ts (401 → /auth/refresh-token) xử lý.
  // Vai trò cụ thể (admin/teacher/parent...) vẫn do RoleGuard ở client kiểm tra.
  const hasAccessToken = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasAccessToken && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
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
