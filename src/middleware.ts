/**
 * Next.js middleware for route protection
 */

import { NextRequest, NextResponse } from "next/server";

// Routes accessible without authentication. Đối chiếu `find src/app -name
// page.tsx` (B-02, plans/reports/code-reviewer-260909-1412-web-review.md) —
// thiếu các route này khiến OAuth login hỏng hoàn toàn + toàn bộ trang công
// khai (catalog khóa học, discussions, tra cứu chứng chỉ, footer links) bị
// middleware redirect về /login.
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/otp",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/oauth",
  "/accept-invitation",
  "/courses",
  "/discussions",
  "/certificates/verify",
  "/terms",
  "/privacy",
  "/403",
];

// /courses là public (catalog + chi tiết khóa học) NHƯNG /courses/[slug]/learn
// (trang học bài) vẫn phải qua middleware — guard thật sự nằm ở client
// (learn-route-guard.tsx) nên không thể để middleware coi nó là public.
const LEARN_ROUTE_PATTERN = /^\/courses\/[^/]+\/learn(?:\/|$)/;

// Review PR #25 (BLOCKER #2): (app)/courses/[slug]/exercises/page.tsx nằm
// trong route group CẦN đăng nhập, nhưng /courses/[slug]/exercises vẫn khớp
// tiền tố public "/courses" ở trên — cùng lỗ hổng như /courses/[slug]/learn,
// phát hiện nhờ test liệt kê MỌI page.tsx dưới các route group cần đăng nhập.
const EXERCISES_ROUTE_PATTERN = /^\/courses\/[^/]+\/exercises(?:\/|$)/;

// Route con của các group cần đăng nhập nhưng lại khớp tiền tố public
// "/courses" — PHẢI loại trừ khỏi isPublicRoute, xem isProtectedRoute bên dưới.
const COURSES_AUTH_SUBROUTE_PATTERNS = [LEARN_ROUTE_PATTERN, EXERCISES_ROUTE_PATTERN];

// Tiền tố các route THẬT SỰ cần đăng nhập (đối chiếu `find src/app -name
// page.tsx`). QA khách 260927 (P1): trước đây middleware coi MỌI path không
// nằm trong PUBLIC_ROUTES là "cần đăng nhập", kể cả URL rác không tồn tại
// route nào — khách gõ nhầm URL bị đá thẳng sang màn hình login giống hệt
// "cần đăng nhập", không có cách nào biết đó là 404. Danh sách dưới đây liệt
// kê tiền tố route BẢO VỆ thật; path không khớp bất kỳ tiền tố nào (và không
// nằm trong PUBLIC_ROUTES) được coi là không tồn tại và để Next.js tự render
// app/not-found.tsx thay vì ép về /login.
const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/achievements",
  "/ai-chat",
  "/cart",
  "/certificates",
  "/checkout",
  "/coins",
  "/contests",
  "/friends",
  "/groups",
  "/help",
  "/home",
  "/leaderboard",
  "/learn",
  "/messages",
  "/my-assignments",
  "/my-attendance",
  "/my-courses",
  "/my-vouchers",
  "/notifications",
  "/parent",
  "/profile",
  "/quizzes",
  "/rooms",
  "/schedule",
  "/settings",
  "/teacher",
];

// Tên cookie httpOnly do backend set — khớp internal/handler/auth_handler.go
// (Login/RefreshToken: "accessToken" 15 phút, "rfToken" 24h).
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "rfToken";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (trừ các route con cần đăng nhập của "/courses" —
  // xem COURSES_AUTH_SUBROUTE_PATTERNS)
  const isPublicRoute =
    !COURSES_AUTH_SUBROUTE_PATTERNS.some((pattern) => pattern.test(pathname)) &&
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

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

  // Path không khớp route bảo vệ nào đã biết (và không phải PUBLIC_ROUTES ở
  // trên) — không phải "cần đăng nhập", mà là route không tồn tại. Để
  // Next.js tự xử lý (render app/not-found.tsx) thay vì ép về /login.
  const isProtectedRoute =
    COURSES_AUTH_SUBROUTE_PATTERNS.some((pattern) => pattern.test(pathname)) ||
    PROTECTED_ROUTE_PREFIXES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

  if (!isProtectedRoute) {
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
