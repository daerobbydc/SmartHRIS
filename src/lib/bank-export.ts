// Export utilities untuk bank transfer dan e-SPT PPh 21
import {
  generateBCACSV as genBCACSV,
  generateMandiriCSV as genMandiriCSV,
  generateBNICSV as genBNICSV,
  generateBRICSV as genBRICSV,
  generateBSICSV as genBSICSV,
  generateStandardCSV as genStandardCSV,
  BankTransferData,
} from "./bank-integration";

export interface PayrollExportData {
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  npwp?: string;
  netSalary: number;
  pph21: number;
  month: number;
  year: number;
  email?: string;
}

// Helper to convert PayrollExportData to BankTransferData
function convertToBankTransferData(data: PayrollExportData[]): BankTransferData[] {
  return data.map((d) => ({
    employeeId: d.employeeId,
    employeeName: `${d.firstName} ${d.lastName}`.trim(),
    bankCode: d.bankName || "BCA",
    bankName: d.bankName || "BCA",
    bankBranch: d.bankBranch,
    accountNumber: d.bankAccount || "",
    amount: d.netSalary,
    reference: `GAJI-${d.year}${d.month.toString().padStart(2, "0")}-${d.employeeId}`,
    description: `Gaji ${getMonthName(d.month)} ${d.year}`,
    email: d.email,
    hasValidAccount: Boolean(d.bankAccount && d.bankAccount.trim().length >= 4),
  }));
}

// ==================== BANK EXPORT ====================

export function generateBCACSV(data: PayrollExportData[], month: number, year: number): string {
  return genBCACSV(convertToBankTransferData(data));
}

export function generateMandiriMCMCSV(data: PayrollExportData[], month: number, year: number): string {
  return genMandiriCSV(convertToBankTransferData(data));
}

export function generateBNICSV(data: PayrollExportData[], month: number, year: number): string {
  return genBNICSV(convertToBankTransferData(data));
}

export function generateBRICSV(data: PayrollExportData[], month: number, year: number): string {
  return genBRICSV(convertToBankTransferData(data));
}

export function generateBSICSV(data: PayrollExportData[], month: number, year: number): string {
  return genBSICSV(convertToBankTransferData(data));
}

export function generateGenericBankCSV(
  data: PayrollExportData[],
  month: number,
  year: number,
  bankName: string
): string {
  return genStandardCSV(convertToBankTransferData(data));
}

// ==================== e-SPT PPh 21 ====================

/**
 * Generate CSV format e-SPT Masa PPh 21
 * Format sesuai format Direktorat Jenderal Pajak
 */
export function generateESPT21CSV(data: PayrollExportData[], month: number, year: number): string {
  const header = [
    "NPWP",
    "Nama",
    "Jenis Pekerjaan",
    "Penghasilan Bruto",
    "Penghitungan PPh 21",
    "PPh 21 Dipotong",
    "Status",
  ].join(";");

  const rows = data.map((d) => [
    d.npwp || "",
    `${d.firstName} ${d.lastName}`,
    " Pegawai Tetap",
    d.netSalary.toFixed(0),
    d.pph21.toFixed(0),
    d.pph21.toFixed(0),
    "1",
  ].join(";"));

  const totalBruto = data.reduce((sum, d) => sum + d.netSalary + d.pph21, 0);
  const totalPPh21 = data.reduce((sum, d) => sum + d.pph21, 0);

  const footer = [
    "",
    "TOTAL",
    "",
    totalBruto.toFixed(0),
    totalPPh21.toFixed(0),
    totalPPh21.toFixed(0),
    "",
  ].join(";");

  return [header, ...rows, footer].join("\n");
}

/**
 * Generate JSON format untuk e-Filing PPh 21
 */
export function generateESPT21JSON(data: PayrollExportData[], month: number, year: number) {
  const npwpEmployer = process.env.COMPANY_NPWP || "";
  const companyName = process.env.COMPANY_NAME || "";

  return {
    header: {
      npwp: npwpEmployer,
      namaPenandatangan: companyName,
      jabatanPenandatangan: "Direktur",
      nomorTelepon: "",
      email: "",
      bulan: month.toString().padStart(2, "0"),
      tahun: year.toString(),
    },
    buktiPotong: data.map((d, i) => ({
      nomorBuktiPotong: `21-${year}${month.toString().padStart(2, "0")}-${(i + 1).toString().padStart(4, "0")}`,
      npwp: d.npwp || "",
      nama: `${d.firstName} ${d.lastName}`,
      jenisPekerjaan: "1",
      jumlahPenghasilanBruto: d.netSalary + d.pph21,
      jumlahPenghasilanKenaPajak: d.netSalary,
      jumlahPPh21: d.pph21,
      status: "1",
    })),
    rekapitulasi: {
      jumlahBuktiPotong: data.length,
      jumlahPenghasilanBruto: data.reduce((sum, d) => sum + d.netSalary + d.pph21, 0),
      jumlahPPh21: data.reduce((sum, d) => sum + d.pph21, 0),
    },
  };
}

// ==================== HELPERS ====================

function getMonthName(month: number): string {
  const months = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months[month] || "";
}

/**
 * Get bank name list
 */
export function getBankList() {
  return [
    { code: "ALL", name: "Semua Bank", format: "CSV" },
    { code: "BCA", name: "Bank Central Asia", format: "KlikBCA" },
    { code: "MANDIRI", name: "Bank Mandiri", format: "MCM 2.0" },
    { code: "BNI", name: "Bank Negara Indonesia", format: "BNI Direct" },
    { code: "BRI", name: "Bank Rakyat Indonesia", format: "BRIVA / CMS" },
    { code: "BSI", name: "Bank Syariah Indonesia", format: "CMS BSI" },
    { code: "CIMB", name: "Bank CIMB Niaga", format: "BizChannel" },
    { code: "PERMATA", name: "Bank Permata", format: "e-Business" },
    { code: "BTN", name: "Bank Tabungan Negara", format: "CMS BTN" },
    { code: "DANAMON", name: "Bank Danamon", format: "CSV" },
  ];
}
