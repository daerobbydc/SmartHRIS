import { NextResponse, NextRequest } from "next/server";
import { canAccessRoute } from "@/lib/permissions";

// Route protection mapping - which routes need which permissions
const PROTECTED_ROUTES: Record<string, string> = {
  // Dashboard - all authenticated users
  "/dashboard": "",

  // Employees
  "/employees": "employee:read",
  "/employees/new": "employee:write",

  // Personalia
  "/personalia/documents": "employee:read",
  "/personalia/training": "employee:read",

  // Absensi
  "/absensi/schedule": "attendance:read",
  "/absensi/overtime": "attendance:read",
  "/absensi/sanctions": "attendance:write",

  // Leave
  "/leave/history": "leave:read",

  // Payroll
  "/payroll": "payroll:read",
  "/payroll/components": "payroll:write",
  "/payroll/thr": "payroll:read",

  // Recruitment
  "/rekrutmen": "recruitment:read",
  "/rekrutmen/blacklist": "recruitment:read",

  // Performance
  "/performance": "performance:read",
  "/performance/feedback": "performance:read",

  // ESS
  "/ess": "leave:write",
  "/ess/approval": "leave:approve",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for API routes, static files, and NextAuth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie
  const sessionCookie = request.cookies.get("authjs.session-token") ||
                        request.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionCookie;
  const isAuthPage = pathname.startsWith("/login");

  // Redirect logged-in users away from login page
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Extract role from cookie or JWT (simplified - in production use proper JWT decode)
  // For now, we check basic access without role from proxy
  // RBAC is enforced in API routes via checkAuth()

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
