/**
 * Granular Role-Based Access Control (RBAC) System
 * Roles: ADMIN (Super Admin), HR (HR Generalist), PAYROLL (Payroll Specialist),
 *        FINANCE (Finance Auditor), MANAGER (Line Manager), EMPLOYEE (Employee)
 */

export type UserRole = "ADMIN" | "HR" | "PAYROLL" | "FINANCE" | "MANAGER" | "EMPLOYEE";

export type Permission =
  | "employee:read"
  | "employee:write"
  | "employee:delete"
  | "payroll:read"
  | "payroll:write"
  | "payroll:approve"
  | "payroll:export"
  | "attendance:read"
  | "attendance:write"
  | "attendance:approve"
  | "leave:read"
  | "leave:write"
  | "leave:approve"
  | "performance:read"
  | "performance:write"
  | "recruitment:read"
  | "recruitment:write"
  | "audit_log:read"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "employee:read",
    "employee:write",
    "employee:delete",
    "payroll:read",
    "payroll:write",
    "payroll:approve",
    "payroll:export",
    "attendance:read",
    "attendance:write",
    "attendance:approve",
    "leave:read",
    "leave:write",
    "leave:approve",
    "performance:read",
    "performance:write",
    "recruitment:read",
    "recruitment:write",
    "audit_log:read",
    "settings:manage",
  ],
  HR: [
    "employee:read",
    "employee:write",
    "attendance:read",
    "attendance:write",
    "attendance:approve",
    "leave:read",
    "leave:write",
    "leave:approve",
    "performance:read",
    "performance:write",
    "recruitment:read",
    "recruitment:write",
    "audit_log:read",
  ],
  PAYROLL: [
    "employee:read",
    "payroll:read",
    "payroll:write",
    "payroll:approve",
    "payroll:export",
    "audit_log:read",
  ],
  FINANCE: [
    "employee:read",
    "payroll:read",
    "payroll:export",
    "audit_log:read",
  ],
  MANAGER: [
    "employee:read",
    "attendance:read",
    "attendance:approve",
    "leave:read",
    "leave:approve",
    "performance:read",
    "performance:write",
  ],
  EMPLOYEE: [
    "attendance:read",
    "attendance:write",
    "leave:read",
    "leave:write",
    "performance:read",
  ],
};

/**
 * Checks if a user role has a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const userRole = (role.toUpperCase() as UserRole) || "EMPLOYEE";
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.EMPLOYEE;
  return permissions.includes(permission);
}

/**
 * Route protection mapping
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/audit-logs": "audit_log:read",
  "/payroll": "payroll:read",
  "/payroll/components": "payroll:write",
  "/payroll/thr": "payroll:read",
  "/employees": "employee:read",
  "/personalia/documents": "employee:read",
  "/rekrutmen": "recruitment:read",
};

/**
 * Checks if user role is authorized to access a given URL pathname
 */
export function canAccessRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  if (role === "ADMIN") return true;

  for (const [routePrefix, requiredPermission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(routePrefix)) {
      return hasPermission(role, requiredPermission);
    }
  }

  return true; // Default allowed for unmapped public/dashboard routes
}
