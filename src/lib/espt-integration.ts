import { prisma } from "@/lib/prisma";

// ==================== E-SPT INTEGRATION (PPh 21) ====================

export interface ESPTData {
  npwp: string;
  nama: string;
  alamat: string;
  penghasilanBruto: number;
  pengurangan: number;
  penghasilanKenaPajak: number;
  pph21Terutang: number;
  pph21Dipotong: number;
  status: "normal" | "kurang_bayar" | "lebih_bayar";
}

export interface ESPTHeader {
  npwp: string;
  nama: string;
  alamat: string;
  tahunPajak: number;
  masaPajak: number;
  jumlahPegawai: number;
  totalPenghasilanBruto: number;
  totalPPh21: number;
}

/**
 * Generate E-SPT 21 data for a payroll period
 */
export async function generateESPTData(
  month: number,
  year: number
): Promise<{ header: ESPTHeader; details: ESPTData[] }> {
  const payrolls = await prisma.payroll.findMany({
    where: { month, year },
    include: {
      employee: true,
    },
  });

  // Get company NPWP (placeholder - would come from company settings)
  const companyNPWP = process.env.COMPANY_NPWP || "12.345.678.9-012.000";
  const companyName = process.env.COMPANY_NAME || "PT SmartHRIS Indonesia";
  const companyAddress = process.env.COMPANY_ADDRESS || "Jl. Teknologi No. 123, Jakarta Selatan";

  const details: ESPTData[] = payrolls.map((payroll) => {
    const penghasilanBruto = Number(payroll.grossIncome);
    const pengurangan = Number(payroll.totalDeduction);
    const penghasilanKenaPajak = penghasilanBruto - pengurangan;
    const pph21Terutang = Number(payroll.pph21);
    const pph21Dipotong = pph21Terutang; // Same as terutang for monthly

    return {
      npwp: payroll.employee.nik || "",
      nama: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      alamat: payroll.employee.address || "",
      penghasilanBruto,
      pengurangan,
      penghasilanKenaPajak,
      pph21Terutang,
      pph21Dipotong,
      status: "normal",
    };
  });

  const header: ESPTHeader = {
    npwp: companyNPWP,
    nama: companyName,
    alamat: companyAddress,
    tahunPajak: year,
    masaPajak: month,
    jumlahPegawai: details.length,
    totalPenghasilanBruto: details.reduce((sum, d) => sum + d.penghasilanBruto, 0),
    totalPPh21: details.reduce((sum, d) => sum + d.pph21Terutang, 0),
  };

  return { header, details };
}

/**
 * Generate CSV format for E-SPT upload to DJP Online
 */
export function generateESPTCSV(data: { header: ESPTHeader; details: ESPTData[] }): string {
  // Format sesuai ketentuan DJP Online
  const lines: string[] = [];

  // Header line
  lines.push([
    data.header.npwp,
    data.header.nama,
    data.header.alamat,
    data.header.tahunPajak,
    data.header.masaPajak,
    data.header.jumlahPegawai,
    data.header.totalPenghasilanBruto,
    data.header.totalPPh21,
  ].join(","));

  // Detail lines
  data.details.forEach((d) => {
    lines.push([
      d.npwp,
      d.nama,
      d.alamat,
      d.penghasilanBruto,
      d.pengurangan,
      d.penghasilanKenaPajak,
      d.pph21Terutang,
      d.pph21Dipotong,
      d.status,
    ].join(","));
  });

  return lines.join("\n");
}

/**
 * Generate JSON format for E-SPT API submission
 */
export function generateESPTJSON(data: { header: ESPTHeader; details: ESPTData[] }): Record<string, unknown> {
  return {
    header: {
      npwp: data.header.npwp,
      nama: data.header.nama,
      alamat: data.header.alamat,
      tahun_pajak: data.header.tahunPajak,
      masa_pajak: data.header.masaPajak,
      jumlah_pegawai: data.header.jumlahPegawai,
      total_penghasilan_bruto: data.header.totalPenghasilanBruto,
      total_pph21: data.header.totalPPh21,
    },
    details: data.details.map((d) => ({
      npwp: d.npwp,
      nama: d.nama,
      alamat: d.alamat,
      penghasilan_bruto: d.penghasilanBruto,
      pengurangan: d.pengurangan,
      penghasilan_kena_pajak: d.penghasilanKenaPajak,
      pph21_terutang: d.pph21Terutang,
      pph21_dipotong: d.pph21Dipotong,
      status: d.status,
    })),
  };
}

/**
 * Generate SPT Tahunan format (annual summary)
 */
export async function generateSPTTahunanData(
  employeeId: string,
  year: number
): Promise<{
  npwp: string;
  nama: string;
  penghasilanBruto: number;
  pengurangan: number;
  penghasilanKenaPajak: number;
  pph21Terutang: number;
  pph21Dipotong: number;
  monthlyBreakdown: { month: number; bruto: number; pph21: number }[];
}> {
  const payrolls = await prisma.payroll.findMany({
    where: {
      employeeId,
      year,
    },
    orderBy: { month: "asc" },
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Get NPWP from EmployeeSalary
  const empSalary = await prisma.employeeSalary.findUnique({
    where: { employeeId },
  });

  const monthlyBreakdown = payrolls.map((p) => ({
    month: p.month,
    bruto: Number(p.grossIncome),
    pph21: Number(p.pph21),
  }));

  const totalBruto = monthlyBreakdown.reduce((sum, m) => sum + m.bruto, 0);
  const totalPPh21 = monthlyBreakdown.reduce((sum, m) => sum + m.pph21, 0);

  return {
    npwp: empSalary?.npwp || "",
    nama: `${employee.firstName} ${employee.lastName}`,
    penghasilanBruto: totalBruto,
    pengurangan: 0, // Calculate based on deductions
    penghasilanKenaPajak: totalBruto, // Simplified
    pph21Terutang: totalPPh21,
    pph21Dipotong: totalPPh21,
    monthlyBreakdown,
  };
}

/**
 * Validate E-SPT data before submission
 */
export function validateESPTData(data: { header: ESPTHeader; details: ESPTData[] }): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.header.npwp) errors.push("NPWP perusahaan tidak boleh kosong");
  if (data.header.jumlahPegawai === 0) errors.push("Tidak ada data pegawai");
  if (data.header.totalPPh21 < 0) errors.push("Total PPh 21 tidak boleh negatif");

  data.details.forEach((d, idx) => {
    if (!d.npwp) errors.push(`NPWP pegawai ke-${idx + 1} tidak boleh kosong`);
    if (d.penghasilanBruto < 0) errors.push(`Penghasilan bruto pegawai ke-${idx + 1} tidak boleh negatif`);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
