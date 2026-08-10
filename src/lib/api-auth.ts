import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { hasPermission, type Permission } from "@/lib/permissions";

interface AuthCheckOptions {
  requiredPermission?: Permission;
  requireAnyPermission?: Permission[];
}

/**
 * Check authentication and permissions for API routes
 * Returns null if authorized, or NextResponse with error if not
 */
export async function checkAuth(
  request: NextRequest,
  options: AuthCheckOptions = {}
): Promise<{ userId: string; role: string } | NextResponse> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  if (!token) {
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
