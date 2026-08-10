import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ==================== LEAVE BALANCE & POLICY ====================

export interface LeaveBalanceInfo {
  employeeId: string;
  employeeName: string;
  year: number;
  leaveType: string;
  total: number;
  used: number;
  pending: number;
  available: number;
  carried: number;
}

export interface LeavePolicyInfo {
  id: string;
  name: string;
  leaveType: string;
  daysPerYear: number;
  minTenureMonths: number | null;
  carryOver: boolean;
  maxCarryOver: number | null;
  isPaid: boolean;
}

/**
 * Get or create leave balance for an employee
 */
export async function getLeaveBalance(
  employeeId: string,
  year: number,
  leaveType: string
): Promise<LeaveBalanceInfo | null> {
  const balance = await p.leaveBalance.findUnique({
    where: {
      employeeId_year_leaveType: {
        employeeId,
        year,
        leaveType: leaveType as "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID",
      },
    },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  if (!balance) return null;

  return {
    employeeId,
    employeeName: `${balance.employee.firstName} ${balance.employee.lastName}`,
    year: balance.year,
    leaveType: balance.leaveType,
    total: balance.total,
    used: balance.used,
    pending: balance.pending,
    available: balance.total + balance.carried - balance.used - balance.pending,
    carried: balance.carried,
  };
}

/**
 * Get all leave balances for an employee in a year
 */
export async function getEmployeeLeaveBalances(
  employeeId: string,
  year: number
): Promise<LeaveBalanceInfo[]> {
  const balances = await p.leaveBalance.findMany({
    where: { employeeId, year },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { leaveType: "asc" },
  });

  return balances.map((b: any) => ({
    employeeId: b.employeeId,
    employeeName: `${b.employee.firstName} ${b.employee.lastName}`,
    year: b.year,
    leaveType: b.leaveType,
    total: b.total,
    used: b.used,
    pending: b.pending,
    available: b.total + b.carried - b.used - b.pending,
    carried: b.carried,
  }));
}

/**
 * Initialize leave balance for a new employee or new year
 */
export async function initializeLeaveBalance(
  employeeId: string,
  year: number
): Promise<void> {
  // Get all active policies
  const policies = await p.leavePolicy.findMany({
    where: { isActive: true },
  });

  // Get employee hire date for tenure check
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { hireDate: true },
  });

  if (!employee) return;

  const tenureMonths = Math.floor(
    (Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  for (const policy of policies) {
    // Check minimum tenure
    if (policy.minTenureMonths && tenureMonths < policy.minTenureMonths) {
      continue;
    }

    // Check if balance already exists
    const existing = await p.leaveBalance.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType: policy.leaveType,
        },
      },
    });

    if (!existing) {
      await p.leaveBalance.create({
        data: {
          employeeId,
          year,
          leaveType: policy.leaveType,
          total: policy.daysPerYear,
          used: 0,
          pending: 0,
          carried: 0,
        },
      });
    }
  }
}

/**
 * Update leave balance when leave is approved
 */
export async function deductLeaveBalance(
  employeeId: string,
  year: number,
  leaveType: string,
  days: number
): Promise<boolean> {
  try {
    await p.leaveBalance.update({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType: leaveType as "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID",
        },
      },
      data: {
        used: { increment: days },
        pending: { decrement: days },
      },
    });
    return true;
  } catch (error) {
    console.error("Deduct leave balance error:", error);
    return false;
  }
}

/**
 * Add pending leave balance when leave is submitted
 */
export async function addPendingLeave(
  employeeId: string,
  year: number,
  leaveType: string,
  days: number
): Promise<boolean> {
  try {
    await p.leaveBalance.update({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType: leaveType as "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID",
        },
      },
      data: {
        pending: { increment: days },
      },
    });
    return true;
  } catch (error) {
    console.error("Add pending leave error:", error);
    return false;
  }
}

/**
 * Check if employee has sufficient leave balance
 */
export async function checkLeaveBalance(
  employeeId: string,
  year: number,
  leaveType: string,
  days: number
): Promise<{ available: boolean; remaining: number }> {
  const balance = await getLeaveBalance(employeeId, year, leaveType);
  
  if (!balance) {
    return { available: false, remaining: 0 };
  }

  return {
    available: balance.available >= days,
    remaining: balance.available,
  };
}

/**
 * Get leave policy by type
 */
export async function getLeavePolicy(
  leaveType: string
): Promise<LeavePolicyInfo | null> {
  const policy = await p.leavePolicy.findFirst({
    where: { leaveType: leaveType as "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID", isActive: true },
  });

  if (!policy) return null;

  return {
    id: policy.id,
    name: policy.name,
    leaveType: policy.leaveType,
    daysPerYear: policy.daysPerYear,
    minTenureMonths: policy.minTenureMonths,
    carryOver: policy.carryOver,
    maxCarryOver: policy.maxCarryOver,
    isPaid: policy.isPaid,
  };
}

/**
 * Get all active leave policies
 */
export async function getAllLeavePolicies(): Promise<LeavePolicyInfo[]> {
  const policies = await p.leavePolicy.findMany({
    where: { isActive: true },
    orderBy: { leaveType: "asc" },
  });

  return policies.map((pol: any) => ({
    id: pol.id,
    name: pol.name,
    leaveType: pol.leaveType,
    daysPerYear: pol.daysPerYear,
    minTenureMonths: pol.minTenureMonths,
    carryOver: pol.carryOver,
    maxCarryOver: pol.maxCarryOver,
    isPaid: pol.isPaid,
  }));
}

/**
 * Process year-end leave carry over
 */
export async function processYearEndCarryOver(year: number): Promise<number> {
  const policies = await p.leavePolicy.findMany({
    where: { isActive: true, carryOver: true },
  });

  let processed = 0;

  for (const policy of policies) {
    const balances = await p.leaveBalance.findMany({
      where: {
        year: year - 1,
        leaveType: policy.leaveType,
      },
    });

    for (const balance of balances) {
      const remaining = balance.total - balance.used;
      const carryOver = Math.min(remaining, policy.maxCarryOver || remaining);

      if (carryOver > 0) {
        // Create or update next year balance
        const nextYearBalance = await p.leaveBalance.findUnique({
          where: {
            employeeId_year_leaveType: {
              employeeId: balance.employeeId,
              year: year,
              leaveType: policy.leaveType,
            },
          },
        });

        if (nextYearBalance) {
          await p.leaveBalance.update({
            where: { id: nextYearBalance.id },
            data: { carried: carryOver },
          });
        } else {
          await p.leaveBalance.create({
            data: {
              employeeId: balance.employeeId,
              year,
              leaveType: policy.leaveType,
              total: policy.daysPerYear,
              carried: carryOver,
            },
          });
        }
        processed++;
      }
    }
  }

  return processed;
}
