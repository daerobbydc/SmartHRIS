"use client";

import { useSession } from "next-auth/react";
import { hasPermission, canAccessRoute, type Permission, type UserRole } from "@/lib/permissions";

interface UsePermissionsReturn {
  role: UserRole;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (pathname: string) => boolean;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;
  canRead: {
    employee: boolean;
    payroll: boolean;
    attendance: boolean;
    leave: boolean;
    performance: boolean;
    recruitment: boolean;
  };
  canWrite: {
    employee: boolean;
    payroll: boolean;
    attendance: boolean;
    leave: boolean;
    performance: boolean;
    recruitment: boolean;
  };
  canApprove: {
    payroll: boolean;
    attendance: boolean;
    leave: boolean;
  };
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session } = useSession();
  const role = ((session?.user?.role as string)?.toUpperCase() || "EMPLOYEE") as UserRole;

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    canAccess: (pathname: string) => canAccessRoute(role, pathname),
    isAdmin: role === "ADMIN",
    isHR: role === "HR",
    isManager: role === "MANAGER",
    isEmployee: role === "EMPLOYEE",

    canRead: {
      employee: hasPermission(role, "employee:read"),
      payroll: hasPermission(role, "payroll:read"),
      attendance: hasPermission(role, "attendance:read"),
      leave: hasPermission(role, "leave:read"),
      performance: hasPermission(role, "performance:read"),
      recruitment: hasPermission(role, "recruitment:read"),
    },

    canWrite: {
      employee: hasPermission(role, "employee:write"),
      payroll: hasPermission(role, "payroll:write"),
      attendance: hasPermission(role, "attendance:write"),
      leave: hasPermission(role, "leave:write"),
      performance: hasPermission(role, "performance:write"),
      recruitment: hasPermission(role, "recruitment:write"),
    },

    canApprove: {
      payroll: hasPermission(role, "payroll:approve"),
      attendance: hasPermission(role, "attendance:approve"),
      leave: hasPermission(role, "leave:approve"),
    },
  };
}
