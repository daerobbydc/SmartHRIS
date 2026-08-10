import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ==================== EMPLOYEE BENEFITS ====================

export interface BenefitInfo {
  id: string;
  name: string;
  description: string;
  type: string;
  coverage: string;
  premium: number;
  employerCoverage: number;
  employeeCoverage: number;
  isActive: boolean;
}

export interface EmployeeBenefitInfo {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitId: string;
  benefitName: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  premium: number;
  employerShare: number;
  employeeShare: number;
}

/**
 * Get all active benefits
 */
export async function getBenefits(): Promise<BenefitInfo[]> {
  return p.benefit.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Create a new benefit
 */
export async function createBenefit(data: {
  name: string;
  description?: string;
  type: string;
  coverage?: string;
  premium?: number;
  employerCoverage?: number;
  employeeCoverage?: number;
}): Promise<BenefitInfo> {
  return p.benefit.create({
    data: {
      name: data.name,
      description: data.description || "",
      type: data.type as any,
      coverage: data.coverage || "STANDARD",
      premium: data.premium || 0,
      employerCoverage: data.employerCoverage || 0,
      employeeCoverage: data.employeeCoverage || 0,
    },
  });
}

/**
 * Enroll employee in benefit
 */
export async function enrollBenefit(
  employeeId: string,
  benefitId: string,
  startDate: Date,
  endDate?: Date
): Promise<EmployeeBenefitInfo> {
  const benefit = await p.benefit.findUnique({
    where: { id: benefitId },
  });

  if (!benefit) throw new Error("Benefit not found");

  return p.employeeBenefit.create({
    data: {
      employeeId,
      benefitId,
      startDate,
      endDate,
      status: "ACTIVE",
      premium: benefit.premium,
      employerShare: benefit.employerCoverage,
      employeeShare: benefit.employeeCoverage,
    },
  });
}

/**
 * Get employee benefits
 */
export async function getEmployeeBenefits(
  employeeId: string
): Promise<EmployeeBenefitInfo[]> {
  return p.employeeBenefit.findMany({
    where: { employeeId, status: "ACTIVE" },
    include: { benefit: true },
  });
}

/**
 * Terminate employee benefit
 */
export async function terminateBenefit(
  id: string
): Promise<boolean> {
  try {
    await p.employeeBenefit.update({
      where: { id },
      data: {
        status: "TERMINATED",
        endDate: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}
