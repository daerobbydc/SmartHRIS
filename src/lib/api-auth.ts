import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { hasPermission, type Permission } from "@/lib/permissions";
import { checkRateLimit, createRateLimitResponse, getClientIp, type RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

interface AuthCheckOptions {
  requiredPermission?: Permission;
  requireAnyPermission?: Permission[];
  rateLimitPreset?: keyof typeof RATE_LIMIT_PRESETS;
}

/**
 * Check authentication, rate limits, and permissions for API routes
 * Returns { userId, role } if authorized, or NextResponse with error/rate limit if not
 */
export async function checkAuth(
  request: NextRequest,
  options: AuthCheckOptions = {}
): Promise<{ userId: string; role: string } | NextResponse> {
  // Apply Rate Limiting if requested or default to API limit
  const clientIp = getClientIp(request);
  const preset = options.rateLimitPreset || "API";
  const rateLimitResult = checkRateLimit(`api:${clientIp}`, preset);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "smarthris-super-secret-key-change-in-production-2024",
  });

  if (!token) {
    // Fallback to ADMIN in development if session cookie is not active
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      return { userId: "admin-dev-id", role: "ADMIN" };
    }

    return NextResponse.json(
      { error: "Unauthorized - Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const userId = token.id as string;
  const role = (token.role as string) || "EMPLOYEE";

  // Admin bypass
  if (role === "ADMIN") {
    return { userId, role };
  }

  // Check single permission
  if (options.requiredPermission) {
    if (!hasPermission(role, options.requiredPermission)) {
      return NextResponse.json(
        { error: `Forbidden - Role ${role} tidak memiliki akses ke fitur ini` },
        { status: 403 }
      );
    }
  }

  // Check any of multiple permissions
  if (options.requireAnyPermission) {
    const hasAny = options.requireAnyPermission.some((p) => hasPermission(role, p));
    if (!hasAny) {
      return NextResponse.json(
        { error: `Forbidden - Role ${role} tidak memiliki akses ke fitur ini` },
        { status: 403 }
      );
    }
  }

  return { userId, role };
}

/**
 * Helper to check permission and return true/false
 */
export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}
