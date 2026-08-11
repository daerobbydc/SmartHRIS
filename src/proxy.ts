import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rate-limit";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit login page access
  if (pathname.startsWith("/login")) {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`login-page:${clientIp}`, "AUTH");
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }
  }

  // Skip proxy for API routes, static files, public careers portal, and NextAuth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/careers") ||
    pathname.startsWith("/careers") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth / Auth.js session cookies (supports both HTTP & HTTPS Vercel production)
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

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
