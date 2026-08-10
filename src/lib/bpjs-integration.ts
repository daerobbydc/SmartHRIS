import { prisma } from "@/lib/prisma";

// ==================== BPJS INTEGRATION ====================

export interface BPJSConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyCode: string;
}

export interface BPJSSubmission {
  employeeName: string;
  nik: string;
  bpjsTkNumber: string;
  bpjsKesNumber: string;
  jhtEmployee: number;
  jhtEmployer: number;
  jpEmployee: number;
  jpEmployer: number;
  jkk: number;
  jkm: number;
  kesehatanEmployee: number;
  kesehatanEmployer: number;
}

export interface BPJSResponse {
  success: boolean;
  message: string;
  referenceNumber?: string;
  submissionDate: Date;
}

// Default BPJS rates (2024)
export const BPJS_RATES = {
  JHT: {
    employee: 0.04, // 4%
    employer: 0.057, // 5.7%
  },
  JP: {
    employee: 0.01, // 1%
    employer: 0.02, // 2%
  },
  JKK: {
    low: 0.0024, // 0.24%
    medium: 0.0054, // 0.54%
    high: 0.0089, // 0.89%
  },
  JKM: 0.003, // 0.3%
  Kesehatan: {
    employee: 0.01, // 1%
    employer: 0.04, // 4%
  },
  // Salary caps
  cap: {
    jht: 9559600, // Rp 9.559.600 (Oct 2024)
    jp: 9559600,
    kesehatan: 12000000, // Rp 12.000.000
  },
};

/**
 * Calculate BPJS contributions for an employee
 */
export function calculateBPJSContributions(
  salary: number,
  riskLevel: "low" | "medium" | "high" = "medium"
): {
  jhtEmployee: number;
  jhtEmployer: number;
  jpEmployee: number;
  jpEmployer: number;
  jkk: number;
  jkm: number;
  kesehatanEmployee: number;
  kesehatanEmployer: number;
  totalEmployee: number;
  totalEmployer: number;
} {
  // Cap salary for calculation
  const cappedSalary = Math.min(salary, BPJS_RATES.cap.jht);
  const cappedSalaryKes = Math.min(salary, BPJS_RATES.cap.kesehatan);

  const jhtEmployee = Math.round(cappedSalary * BPJS_RATES.JHT.employee);
  const jhtEmployer = Math.round(cappedSalary * BPJS_RATES.JHT.employer);
  const jpEmployee = Math.round(cappedSalary * BPJS_RATES.JP.employee);
  const jpEmployer = Math.round(cappedSalary * BPJS_RATES.JP.employer);
  const jkk = Math.round(cappedSalary * BPJS_RATES.JKK[riskLevel]);
  const jkm = Math.round(cappedSalary * BPJS_RATES.JKM);
  const kesehatanEmployee = Math.round(cappedSalaryKes * BPJS_RATES.Kesehatan.employee);
  const kesehatanEmployer = Math.round(cappedSalaryKes * BPJS_RATES.Kesehatan.employer);

  return {
    jhtEmployee,
    jhtEmployer,
    jpEmployee,
    jpEmployer,
    jkk,
    jkm,
    kesehatanEmployee,
    kesehatanEmployer,
    totalEmployee: jhtEmployee + jpEmployee + kesehatanEmployee,
    totalEmployer: jhtEmployer + jpEmployer + jkk + jkm + kesehatanEmployer,
  };
}

/**
 * Generate BPJS submission data for a payroll period
 */
export async function generateBPJSSubmission(
  month: number,
  year: number
): Promise<BPJSSubmission[]> {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: { employee: true },
  });

  return payrolls.map((payroll) => ({
    employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
    nik: payroll.employee.nik || "",
    bpjsTkNumber: payroll.employee.nik || "", // In real app, get from EmployeeSalary
    bpjsKesNumber: payroll.employee.nik || "",
    jhtEmployee: Number(payroll.bpjsJhtEmployee),
    jhtEmployer: Number(payroll.bpjsJhtEmployer),
    jpEmployee: Number(payroll.bpjsJpEmployee),
    jpEmployer: Number(payroll.bpjsJpEmployer),
    jkk: Number(payroll.bpjsJkk),
    jkm: Number(payroll.bpjsJkm),
    kesehatanEmployee: Number(payroll.bpjsKesehatanEmployee),
    kesehatanEmployer: Number(payroll.bpjsKesehatanEmployer),
  }));
}

/**
 * Format BPJS submission for SPRINT API (BPJS Online)
 * Note: This is a placeholder - actual API integration requires BPJS credentials
 */
export function formatBPJSForAPI(submissions: BPJSSubmission[]): Record<string, unknown>[] {
  return submissions.map((sub, idx) => ({
    no: idx + 1,
    nama_peserta: sub.employeeName,
    nik: sub.nik,
    no_bpjs_tk: sub.bpjsTkNumber,
    no_bpjs_kes: sub.bpjsKesNumber,
    iuran_jht_pekerja: sub.jhtEmployee,
    iuran_jht_pengusaha: sub.jhtEmployer,
    iuran_jp_pekerja: sub.jpEmployee,
    iuran_jp_pengusaha: sub.jpEmployer,
    iuran_jkk: sub.jkk,
    iuran_jkm: sub.jkm,
    iuran_kes_pekerja: sub.kesehatanEmployee,
    iuran_kes_pengusaha: sub.kesehatanEmployer,
  }));
}

/**
 * Generate BPJS CSV for upload
 */
export function generateBPJSCSV(submissions: BPJSSubmission[]): string {
  const headers = [
    "No",
    "Nama Peserta",
    "NIK",
    "No BPJS TK",
    "No BPJS Kes",
    "JHT Pekerja",
    "JHT Pengusaha",
    "JP Pekerja",
    "JP Pengusaha",
    "JKK",
    "JKM",
    "Kes Pekerja",
    "Kes Pengusaha",
  ];

  const rows = submissions.map((sub, idx) => [
    idx + 1,
    sub.employeeName,
    sub.nik,
    sub.bpjsTkNumber,
    sub.bpjsKesNumber,
    sub.jhtEmployee,
    sub.jhtEmployer,
    sub.jpEmployee,
    sub.jpEmployer,
    sub.jkk,
    sub.jkm,
    sub.kesehatanEmployee,
    sub.kesehatanEmployer,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Submit to BPJS API (placeholder - needs real credentials)
 */
export async function submitToBPJS(
  month: number,
  year: number
): Promise<BPJSResponse> {
  // In production, this would call the actual BPJS API
  // For now, return a mock response
  return {
    success: true,
    message: `BPJS submission for ${month}/${year} prepared successfully`,
    referenceNumber: `BPJS-${year}${month.toString().padStart(2, "0")}-${Date.now()}`,
    submissionDate: new Date(),
  };
}
