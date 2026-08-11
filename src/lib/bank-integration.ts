import { prisma } from "@/lib/prisma";

// ==================== BANK AUTO-UPLOAD INTEGRATION ====================

export interface BankTransferData {
  employeeId: string;
  employeeName: string;
  bankCode: string;
  bankName: string;
  bankBranch?: string;
  accountNumber: string;
  amount: number;
  reference: string;
  description: string;
  email?: string;
  hasValidAccount: boolean;
}

export interface BankConfig {
  name: string;
  code: string;
  numericCode: string;
  csvFormat: "klikbca" | "mandiri" | "bni" | "bri" | "bsi" | "standard";
  delimiter: string;
  hasHeader: boolean;
  supportedFormats: ("csv" | "txt")[];
}

// Bank configurations for Indonesian Banks
export const BANK_CONFIGS: Record<string, BankConfig> = {
  BCA: {
    name: "Bank Central Asia (BCA)",
    code: "BCA",
    numericCode: "014",
    csvFormat: "klikbca",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv", "txt"],
  },
  MANDIRI: {
    name: "Bank Mandiri (MCM 2.0)",
    code: "MANDIRI",
    numericCode: "008",
    csvFormat: "mandiri",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  BNI: {
    name: "Bank Negara Indonesia (BNI Direct)",
    code: "BNI",
    numericCode: "009",
    csvFormat: "bni",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  BRI: {
    name: "Bank Rakyat Indonesia (BRIVA / CMS)",
    code: "BRI",
    numericCode: "002",
    csvFormat: "bri",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  BSI: {
    name: "Bank Syariah Indonesia (BSI CMS)",
    code: "BSI",
    numericCode: "451",
    csvFormat: "bsi",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  CIMB: {
    name: "Bank CIMB Niaga (BizChannel)",
    code: "CIMB",
    numericCode: "022",
    csvFormat: "standard",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  PERMATA: {
    name: "Bank Permata (Permata e-Business)",
    code: "PERMATA",
    numericCode: "013",
    csvFormat: "standard",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  BTN: {
    name: "Bank Tabungan Negara (BTN CMS)",
    code: "BTN",
    numericCode: "200",
    csvFormat: "standard",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  DANAMON: {
    name: "Bank Danamon",
    code: "DANAMON",
    numericCode: "011",
    csvFormat: "standard",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
  ALL: {
    name: "Semua Bank (Standard Transfer Format)",
    code: "ALL",
    numericCode: "000",
    csvFormat: "standard",
    delimiter: ";",
    hasHeader: true,
    supportedFormats: ["csv"],
  },
};

function getMonthNameIndonesian(month: number): string {
  const months = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[month] || "";
}

function formatDate(
  d: Date,
  format: "DD/MM/YYYY" | "YYYYMMDD" | "YYYY-MM-DD" = "DD/MM/YYYY"
): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (format === "YYYYMMDD") return `${year}${month}${day}`;
  if (format === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

export function getBankCodeByName(name: string): string {
  const n = name.toUpperCase();
  if (n.includes("BCA")) return "BCA";
  if (n.includes("MANDIRI")) return "MANDIRI";
  if (n.includes("BNI")) return "BNI";
  if (n.includes("BRI")) return "BRI";
  if (n.includes("BSI") || n.includes("SYARIAH INDONESIA")) return "BSI";
  if (n.includes("CIMB")) return "CIMB";
  if (n.includes("PERMATA")) return "PERMATA";
  if (n.includes("BTN")) return "BTN";
  if (n.includes("DANAMON")) return "DANAMON";
  return "STANDARD";
}

/**
 * Get bank transfer data from payroll with full employee & bank details
 */
export async function getBankTransferData(
  month: number,
  year: number,
  bankCode?: string,
  includeAllStatus: boolean = false
): Promise<BankTransferData[]> {
  const where: Record<string, unknown> = {
    month,
    year,
  };

  if (!includeAllStatus) {
    where.status = { in: ["PAID", "PROCESSED", "PENDING"] };
  }

  const payrolls = await prisma.payroll.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
        },
      },
    },
  });

  const employeeIds = payrolls.map((p) => p.employee.id);
  const salaries = await prisma.employeeSalary.findMany({
    where: { employeeId: { in: employeeIds } },
  });
  const salaryMap = new Map(salaries.map((s) => [s.employeeId, s]));

  const result: BankTransferData[] = payrolls.map((payroll) => {
    const emp = payroll.employee;
    const salary = salaryMap.get(emp.id);

    const bankName = (emp.bankName || salary?.bankName || "BCA").toUpperCase().trim();
    const bankAccount = (emp.bankAccount || salary?.bankAccount || "").trim();
    const bankBranch = emp.bankBranch || salary?.bankBranch || "";
    const email = emp.user?.email || "";

    const empBankCode = getBankCodeByName(bankName);
    const amount = Number(payroll.netSalary);
    const periodStr = `${year}${month.toString().padStart(2, "0")}`;
    const reference = `GAJI-${periodStr}-${emp.employeeId}`;
    const description = `Gaji ${getMonthNameIndonesian(month)} ${year}`;

    return {
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
      bankCode: empBankCode,
      bankName,
      bankBranch,
      accountNumber: bankAccount,
      amount,
      reference,
      description,
      email,
      hasValidAccount: bankAccount.length >= 4,
    };
  });

  if (bankCode && bankCode.toUpperCase() !== "ALL") {
    const targetCode = bankCode.toUpperCase();
    return result.filter(
      (t) =>
        t.bankCode.toUpperCase() === targetCode ||
        t.bankName.toUpperCase().includes(targetCode)
    );
  }

  return result;
}

/**
 * Generate BCA KlikBCA Bisnis CSV format
 */
export function generateBCACSV(transfers: BankTransferData[]): string {
  const dateStr = formatDate(new Date(), "DD/MM/YYYY");
  const lines: string[] = [];
  lines.push(`No;Rekening Tujuan;Nama Penerima;Jumlah Transfer;Tanggal;Keterangan`);
  transfers.forEach((t, i) => {
    lines.push(
      `${i + 1};${t.accountNumber || ""};${t.employeeName};${t.amount.toFixed(2).replace(".", ",")};${dateStr};${t.description}`
    );
  });
  return lines.join("\n");
}

/**
 * Generate BCA Corporate Fixed-Width TXT format
 */
export function generateBCATXT(transfers: BankTransferData[]): string {
  const lines: string[] = [];
  transfers.forEach((t) => {
    lines.push(
      `${(t.accountNumber || "").padEnd(16, " ")}|${t.employeeName.padEnd(35, " ")}|${t.amount.toFixed(0).padStart(15, "0")}|${t.description.padEnd(30, " ")}`
    );
  });
  return lines.join("\r\n");
}

/**
 * Generate Mandiri MCM 2.0 CSV format
 */
export function generateMandiriCSV(transfers: BankTransferData[]): string {
  const headers = [
    "Rekening Asal",
    "Rekening Tujuan",
    "Nama Penerima",
    "Jumlah Transfer",
    "Keterangan",
    "Email Penerima",
    "Referensi",
  ];

  const rows = transfers.map((t) => [
    "",
    t.accountNumber || "",
    `"${t.employeeName.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${t.description.replace(/"/g, '""')}"`,
    t.email || "",
    t.reference,
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate BNI Direct CSV format
 */
export function generateBNICSV(transfers: BankTransferData[]): string {
  const headers = [
    "No Rekening",
    "Nama Penerima",
    "Nominal",
    "Keterangan",
    "Referensi",
  ];

  const rows = transfers.map((t) => [
    t.accountNumber || "",
    `"${t.employeeName.replace(/"/g, '""')}"`,
    t.amount.toFixed(0),
    `"${t.description.replace(/"/g, '""')}"`,
    t.reference,
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate BRI BRIVA / CMS CSV format
 */
export function generateBRICSV(transfers: BankTransferData[]): string {
  const headers = [
    "NOMOR REKENING PENERIMA",
    "NAMA PENERIMA",
    "NOMINAL",
    "BERITA",
  ];

  const rows = transfers.map((t) => [
    t.accountNumber || "",
    `"${t.employeeName.replace(/"/g, '""')}"`,
    t.amount.toFixed(0),
    `"${t.description.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate BSI CMS CSV format
 */
export function generateBSICSV(transfers: BankTransferData[]): string {
  const headers = [
    "REKENING TUJUAN",
    "NAMA PENERIMA",
    "NOMINAL",
    "BERITA",
    "KODE BANK",
  ];

  const rows = transfers.map((t) => [
    t.accountNumber || "",
    `"${t.employeeName.replace(/"/g, '""')}"`,
    t.amount.toFixed(0),
    `"${t.description.replace(/"/g, '""')}"`,
    "451",
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate standard Multi-Bank CSV format
 */
export function generateStandardCSV(transfers: BankTransferData[]): string {
  const headers = [
    "No",
    "ID Karyawan",
    "Nama Karyawan",
    "Bank",
    "No Rekening",
    "Cabang",
    "Jumlah Transfer (IDR)",
    "Keterangan",
    "Referensi",
    "Status Rekening",
  ];

  const rows = transfers.map((t, idx) => [
    idx + 1,
    t.employeeId,
    `"${t.employeeName.replace(/"/g, '""')}"`,
    t.bankName,
    t.accountNumber || "-",
    `"${(t.bankBranch || "-").replace(/"/g, '""')}"`,
    t.amount.toFixed(0),
    `"${t.description.replace(/"/g, '""')}"`,
    t.reference,
    t.hasValidAccount ? "VALID" : "TIDAK ADA REKENING",
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

/**
 * Generate bank transfer file based on bank code and requested format
 */
export function generateBankFile(
  transfers: BankTransferData[],
  bankCode: string,
  fileFormat: "csv" | "txt" = "csv"
): { content: string; filename: string; contentType: string } {
  const timestamp = new Date().toISOString().split("T")[0];
  const code = bankCode.toUpperCase();

  if (fileFormat === "txt" && code === "BCA") {
    return {
      content: generateBCATXT(transfers),
      filename: `bca-payroll-${timestamp}.txt`,
      contentType: "text/plain;charset=utf-8;",
    };
  }

  let content: string;
  switch (code) {
    case "BCA":
      content = generateBCACSV(transfers);
      break;
    case "MANDIRI":
      content = generateMandiriCSV(transfers);
      break;
    case "BNI":
      content = generateBNICSV(transfers);
      break;
    case "BRI":
      content = generateBRICSV(transfers);
      break;
    case "BSI":
      content = generateBSICSV(transfers);
      break;
    default:
      content = generateStandardCSV(transfers);
  }

  return {
    content,
    filename: `transfer-${code.toLowerCase()}-${timestamp}.${fileFormat}`,
    contentType: fileFormat === "txt" ? "text/plain;charset=utf-8;" : "text/csv;charset=utf-8;",
  };
}

/**
 * Generate transfer summary report for UI preview
 */
export function getBankTransferSummary(transfers: BankTransferData[]) {
  const totalTransfers = transfers.length;
  const validTransfers = transfers.filter((t) => t.hasValidAccount);
  const missingAccountTransfers = transfers.filter((t) => !t.hasValidAccount);

  const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
  const validAmount = validTransfers.reduce((sum, t) => sum + t.amount, 0);

  const byBank: Record<string, { count: number; amount: number; validCount: number }> = {};

  transfers.forEach((t) => {
    const bank = t.bankName || "LAINNYA";
    if (!byBank[bank]) {
      byBank[bank] = { count: 0, amount: 0, validCount: 0 };
    }
    byBank[bank].count++;
    byBank[bank].amount += t.amount;
    if (t.hasValidAccount) {
      byBank[bank].validCount++;
    }
  });

  return {
    totalTransfers,
    validCount: validTransfers.length,
    missingCount: missingAccountTransfers.length,
    totalAmount,
    validAmount,
    missingEmployees: missingAccountTransfers.map((t) => ({
      employeeId: t.employeeId,
      employeeName: t.employeeName,
    })),
    byBank,
  };
}
