// Export utilities untuk bank transfer dan e-SPT PPh 21

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
}

// ==================== BANK EXPORT ====================

/**
 * Generate BCA KlikBCA Bisnis CSV format
 */
export function generateBCACSV(data: PayrollExportData[], month: number, year: number): string {
  const header = [
    "No",
    "Rekening Tujuan",
    "Nama Penerima",
    "Jumlah Transfer",
    "Keterangan",
  ].join(";");

  const rows = data.map((d, i) => [
    i + 1,
    d.bankAccount || "",
    `${d.firstName} ${d.lastName}`,
    d.netSalary.toFixed(2).replace(".", ","),
    `Gaji ${getMonthName(month)} ${year}`,
  ].join(";"));

  return [header, ...rows].join("\n");
}

/**
 * Generate Mandiri MCM CSV format
 */
export function generateMandiriMCMCSV(data: PayrollExportData[], month: number, year: number): string {
  // Mandiri MCM format: Rekening Asal;Rekening Tujuan;Nama Penerima;Jumlah;Keterangan;Email
  const header = [
    "Rekening Asal",
    "Rekening Tujuan",
    "Nama Penerima",
    "Jumlah Transfer",
    "Keterangan",
    "Email Penerima",
  ].join(";");

  const rows = data.map((d) => [
    "", // Rekening asal (diisi manual atau dari config)
    d.bankAccount || "",
    `${d.firstName} ${d.lastName}`,
    d.netSalary.toFixed(2),
    `Gaji ${getMonthName(month)} ${year}`,
    "", // Email optional
  ].join(";"));

  return [header, ...rows].join("\n");
}

/**
 * Generate BNI CSV format
 */
export function generateBNICSV(data: PayrollExportData[], month: number, year: number): string {
  // BNI format
  const header = [
    "No Rekening",
    "Nama Penerima",
    "Nominal",
    "Keterangan",
  ].join(";");

  const rows = data.map((d, i) => [
    d.bankAccount || "",
    `${d.firstName} ${d.lastName}`,
    d.netSalary.toFixed(2),
    `Gaji${getMonthName(month)}${year}`,
  ].join(";"));

  return [header, ...rows].join("\n");
}

/**
 * Generate BRI CSV format (BRIVA)
 */
export function generateBRICSV(data: PayrollExportData[], month: number, year: number): string {
  // BRI BRIVA format
  const header = [
    "Kode Bayar",
    "Jumlah",
    "Keterangan",
  ].join(";");

  const rows = data.map((d) => [
    d.bankAccount || "",
    d.netSalary.toFixed(2),
    `GAJI ${getMonthName(month)} ${year}`,
  ].join(";"));

  return [header, ...rows].join("\n");
}

/**
 * Generate generic bank transfer CSV
 */
export function generateGenericBankCSV(
  data: PayrollExportData[],
  month: number,
  year: number,
  bankName: string
): string {
  const header = [
    "No",
    "Rekening Tujuan",
    "Nama Penerima",
    "Jumlah Transfer",
    "Keterangan",
    "Bank",
  ].join(";");

  const rows = data.map((d, i) => [
    i + 1,
    d.bankAccount || "-",
    `${d.firstName} ${d.lastName}`,
    d.netSalary.toFixed(0),
    `Gaji ${getMonthName(month)} ${year}`,
    bankName,
  ].join(";"));

  return [header, ...rows].join("\n");
}

// ==================== e-SPT PPh 21 ====================

/**
 * Generate CSV format e-SPT Masa PPh 21
 * Format sesuai format Direktorat Jenderal Pajak
 */
export function generateESPT21CSV(data: PayrollExportData[], month: number, year: number): string {
  // Header e-SPT 21-1
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

  // Footer
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
      jenisPekerjaan: "1", // Pegawai Tetap
      jumlahPenghasilanBruto: d.netSalary + d.pph21,
      jumlahPenghasilanKenaPajak: d.netSalary,
      jumlahPPh21: d.pph21,
      status: "1", // Pegawai Tetap
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
    { code: "BCA", name: "Bank Central Asia", format: "KlikBCA" },
    { code: "MANDIRI", name: "Bank Mandiri", format: "MCM" },
    { code: "BNI", name: "Bank Negara Indonesia", format: "BNI" },
    { code: "BRI", name: "Bank Rakyat Indonesia", format: "BRIVA" },
    { code: "BTN", name: "Bank Tabungan Negara", format: "CSV" },
    { code: "DANAMON", name: "Bank Danamon", format: "CSV" },
    { code: "CIMB", name: "Bank CIMB Niaga", format: "CSV" },
    { code: "PERMATA", name: "Bank Permata", format: "CSV" },
  ];
}
