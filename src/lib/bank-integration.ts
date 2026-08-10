import { prisma } from "@/lib/prisma";

// ==================== BANK AUTO-UPLOAD INTEGRATION ====================

export interface BankTransferData {
  employeeName: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  reference: string;
  description: string;
}

export interface BankConfig {
  name: string;
  code: string;
  csvFormat: "standard" | "klikbca" | "mandiri" | "bni" | "bri";
  delimiter: string;
  hasHeader: boolean;
}

// Bank configurations
export const BANK_CONFIGS: Record<string, BankConfig> = {
  BCA: {
    name: "Bank Central Asia",
    code: "014",
    csvFormat: "klikbca",
    delimiter: ",",
    hasHeader: true,
  },
  MANDIRI: {
    name: "Bank Mandiri",
    code: "008",
    csvFormat: "mandiri",
    delimiter: ",",
    hasHeader: true,
  },
  BNI: {
    name: "Bank Negara Indonesia",
    code: "009",
    csvFormat: "bni",
    delimiter: ",",
    hasHeader: true,
  },
  BRI: {
    name: "Bank Rakyat Indonesia",
    code: "002",
    csvFormat: "bri",
    delimiter: ";",
    hasHeader: true,
  },
  BSI: {
    name: "Bank Syariah Indonesia",
    code: "451",
    csvFormat: "standard",
    delimiter: ",",
    hasHeader: true,
  },
};

/**
 * Get bank transfer data from payroll
 */
export async function getBankTransferData(
  month: number,
  year: number,
  bankCode?: string
): Promise<BankTransferData[]> {
  const where: Record<string, unknown> = {
    month,
    year,
    status: "PROCESSED",
  };

  if (bankCode) {
    where.employee = {
      employee: {
        // In real app, filter by bank from EmployeeSalary
      },
    };
  }

  const payrolls = await prisma.payroll.findMany({
    where,
    include: {
      employee: true,
    },
  });

  return payrolls
    .filter((p) => p.employee.bankAccount) // Only employees with bank accounts
    .map((payroll) => ({
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      bankCode: "014", // Would come from EmployeeSalary
      bankName: "BCA",
      accountNumber: payroll.employee.bankAccount || "",
      amount: Number(payroll.netSalary),
      reference: `SALARY-${year}${month.toString().padStart(2, "0")}-${payroll.employee.employeeId}`,
      description: `Gaji ${new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
    }));
}

/**
 * Generate BCA KlikBCA CSV format
 */
export function generateBCACSV(transfers: BankTransferData[]): string {
  // BCA KlikBCA format:
  // Header: Rekening Pengirim,Tanggal Transfer,Keterangan
  // Detail: Rekening Tujuan,Nominal,Keterangan
  
  const lines: string[] = [];
  
  // Header line
  lines.push(`${transfers[0]?.accountNumber || ""},${new Date().toLocaleDateString("id/MM/yyyy")},Transfer Gaji`);
  
  // Transfer details
  transfers.forEach((t) => {
    lines.push(`${t.accountNumber},${t.amount},${t.description}`);
  });

  return lines.join("\n");
}

/**
 * Generate Mandiri MCM CSV format
 */
export function generateMandiriCSV(transfers: BankTransferData[]): string {
  // Mandiri MCM format:
  // Header row with column names
  // Data rows
  
  const headers = [
    "Rekening Tujuan",
    "Nama Penerima",
    "Nominal",
    "Keterangan",
    "Referensi",
  ];

  const rows = transfers.map((t) => [
    t.accountNumber,
    t.employeeName,
    t.amount,
    t.description,
    t.reference,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generate BNI CSV format
 */
export function generateBNICSV(transfers: BankTransferData[]): string {
  // BNI format
  const headers = [
    "No",
    "Rekening Tujuan",
    "Nama",
    "Nominal",
    "Berita",
  ];

  const rows = transfers.map((t, idx) => [
    idx + 1,
    t.accountNumber,
    t.employeeName,
    t.amount,
    t.description,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generate BRI CSV format (semicolon delimited)
 */
export function generateBRICSV(transfers: BankTransferData[]): string {
  const headers = [
    "NOMOR REKENING PENERIMA",
    "NAMA PENERIMA",
    "NOMINAL",
    "BERITA",
  ];

  const rows = transfers.map((t) => [
    t.accountNumber,
    t.employeeName,
    t.amount,
    t.description,
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate bank transfer file based on bank code
 */
export function generateBankFile(
  transfers: BankTransferData[],
  bankCode: string
): { content: string; filename: string; contentType: string } {
  const bank = BANK_CONFIGS[bankCode];
  if (!bank) {
    throw new Error(`Bank ${bankCode} not supported`);
  }

  let content: string;
  const timestamp = new Date().toISOString().split("T")[0];

  switch (bank.csvFormat) {
    case "klikbca":
      content = generateBCACSV(transfers);
      break;
    case "mandiri":
      content = generateMandiriCSV(transfers);
      break;
    case "bni":
      content = generateBNICSV(transfers);
      break;
    case "bri":
      content = generateBRICSV(transfers);
      break;
    default:
      content = generateStandardCSV(transfers);
  }

  return {
    content,
    filename: `transfer-${bankCode.toLowerCase()}-${timestamp}.csv`,
    contentType: "text/csv;charset=utf-8;",
  };
}

/**
 * Generate standard CSV format
 */
function generateStandardCSV(transfers: BankTransferData[]): string {
  const headers = [
    "No",
    "Nama",
    "Bank",
    "Rekening",
    "Nominal",
    "Keterangan",
    "Referensi",
  ];

  const rows = transfers.map((t, idx) => [
    idx + 1,
    t.employeeName,
    t.bankName,
    t.accountNumber,
    t.amount,
    t.description,
    t.reference,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generate transfer summary report
 */
export function generateTransferSummary(transfers: BankTransferData[]): {
  totalTransfers: number;
  totalAmount: number;
  byBank: Record<string, { count: number; amount: number }>;
} {
  const summary = {
    totalTransfers: transfers.length,
    totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
    byBank: {} as Record<string, { count: number; amount: number }>,
  };

  transfers.forEach((t) => {
    if (!summary.byBank[t.bankName]) {
      summary.byBank[t.bankName] = { count: 0, amount: 0 };
    }
    summary.byBank[t.bankName].count++;
    summary.byBank[t.bankName].amount += t.amount;
  });

  return summary;
}
