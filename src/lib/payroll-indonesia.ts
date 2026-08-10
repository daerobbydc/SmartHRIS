// PPh 21 TER (Tarif Efektif Rata-Rata) sesuai PMK 168/2023
// Berlaku untuk Wajib Pajak Dalam Negeri (WPDN) tidak memiliki NPWP atau tidak terdaftar

export interface PPh21Result {
  grossIncome: number;
  ptkpDeduction: number;
  pkp: number;
  pph21: number;
  pph21Type: "A" | "B" | "C";
  effectiveRate: number;
}

// PTKP (Penghasilan Tidak Kena Pajak) 2024
export const PTKP_2024 = {
  TK: { "0": 54_000_000, "1": 58_500_000, "2": 63_000_000, "3": 67_500_000 },
  K:  { "0": 58_500_000, "1": 63_000_000, "2": 67_500_000, "3": 72_000_000 },
  K1: { "0": 112_500_000, "1": 117_000_000, "2": 121_500_000, "3": 126_000_000 },
  K2: { "0": 117_000_000, "1": 121_500_000, "2": 126_000_000, "3": 130_500_000 },
} as const;

// TER A - Penghasilan Bruto ≤ Rp500 juta/tahun (≤ Rp41,67 juta/bulan)
export const TER_A_MONTHLY = [
  { min: 0, max: 5_400_000, rate: 0 },
  { min: 5_400_001, max: 5_650_000, rate: 0.25 },
  { min: 5_650_001, max: 5_950_000, rate: 0.50 },
  { min: 5_950_001, max: 6_300_000, rate: 0.75 },
  { min: 6_300_001, max: 6_750_000, rate: 1.00 },
  { min: 6_750_001, max: 7_250_000, rate: 1.25 },
  { min: 7_250_001, max: 7_800_000, rate: 1.50 },
  { min: 7_800_001, max: 8_450_000, rate: 1.75 },
  { min: 8_450_001, max: 9_150_000, rate: 2.00 },
  { min: 9_150_001, max: 10_000_000, rate: 2.25 },
  { min: 10_000_001, max: 10_950_000, rate: 2.50 },
  { min: 10_950_001, max: 12_100_000, rate: 3.00 },
  { min: 12_100_001, max: 13_500_000, rate: 3.50 },
  { min: 13_500_001, max: 15_250_000, rate: 4.00 },
  { min: 15_250_001, max: 17_500_000, rate: 5.00 },
  { min: 17_500_001, max: 20_750_000, rate: 6.00 },
  { min: 20_750_001, max: 25_500_000, rate: 7.00 },
  { min: 25_500_001, max: 35_500_000, rate: 8.00 },
  { min: 35_500_001, max: 41_670_000, rate: 9.00 },
] as const;

// TER B - Penghasilan Bruto > Rp500 juta - ≤ Rp5 miliar/tahun
export const TER_B_MONTHLY = [
  { min: 0, max: 5_400_000, rate: 0 },
  { min: 5_400_001, max: 5_650_000, rate: 0.25 },
  { min: 5_650_001, max: 5_950_000, rate: 0.50 },
  { min: 5_950_001, max: 6_300_000, rate: 0.75 },
  { min: 6_300_001, max: 6_750_000, rate: 1.00 },
  { min: 6_750_001, max: 7_250_000, rate: 1.25 },
  { min: 7_250_001, max: 7_800_000, rate: 1.50 },
  { min: 7_800_001, max: 8_450_000, rate: 1.75 },
  { min: 8_450_001, max: 9_150_000, rate: 2.00 },
  { min: 9_150_001, max: 10_000_000, rate: 2.25 },
  { min: 10_000_001, max: 10_950_000, rate: 2.50 },
  { min: 10_950_001, max: 12_100_000, rate: 3.00 },
  { min: 12_100_001, max: 13_500_000, rate: 3.50 },
  { min: 13_500_001, max: 15_250_000, rate: 4.00 },
  { min: 15_250_001, max: 17_500_000, rate: 5.00 },
  { min: 17_500_001, max: 20_750_000, rate: 6.00 },
  { min: 20_750_001, max: 25_500_000, rate: 7.00 },
  { min: 25_500_001, max: 35_500_000, rate: 8.00 },
  { min: 35_500_001, max: 41_670_000, rate: 9.00 },
  { min: 41_670_001, max: 50_000_000, rate: 11.00 },
  { min: 50_000_001, max: 65_000_000, rate: 12.00 },
  { min: 65_000_001, max: 80_000_000, rate: 14.00 },
  { min: 80_000_001, max: 100_000_000, rate: 16.00 },
  { min: 100_000_001, max: 150_000_000, rate: 18.00 },
  { min: 150_000_001, max: 300_000_000, rate: 21.00 },
  { min: 300_000_001, max: 500_000_000, rate: 24.00 },
  { min: 500_000_001, max: Infinity, rate: 30.00 },
] as const;

// TER C - Penghasilan Bruto > Rp5 miliar/tahun
export const TER_C_MONTHLY = [
  { min: 0, max: 5_400_000, rate: 0 },
  { min: 5_400_001, max: 5_650_000, rate: 0.25 },
  { min: 5_650_001, max: 5_950_000, rate: 0.50 },
  { min: 5_950_001, max: 6_300_000, rate: 0.75 },
  { min: 6_300_001, max: 6_750_000, rate: 1.00 },
  { min: 6_750_001, max: 7_250_000, rate: 1.25 },
  { min: 7_250_001, max: 7_800_000, rate: 1.50 },
  { min: 7_800_001, max: 8_450_000, rate: 1.75 },
  { min: 8_450_001, max: 9_150_000, rate: 2.00 },
  { min: 9_150_001, max: 10_000_000, rate: 2.25 },
  { min: 10_000_001, max: 10_950_000, rate: 2.50 },
  { min: 10_950_001, max: 12_100_000, rate: 3.00 },
  { min: 12_100_001, max: 13_500_000, rate: 3.50 },
  { min: 13_500_001, max: 15_250_000, rate: 4.00 },
  { min: 15_250_001, max: 17_500_000, rate: 5.00 },
  { min: 17_500_001, max: 20_750_000, rate: 6.00 },
  { min: 20_750_001, max: 25_500_000, rate: 7.00 },
  { min: 25_500_001, max: 35_500_000, rate: 8.00 },
  { min: 35_500_001, max: 41_670_000, rate: 9.00 },
  { min: 41_670_001, max: 50_000_000, rate: 11.00 },
  { min: 50_000_001, max: 65_000_000, rate: 12.00 },
  { min: 65_000_001, max: 80_000_000, rate: 14.00 },
  { min: 80_000_001, max: 100_000_000, rate: 16.00 },
  { min: 100_000_001, max: 150_000_000, rate: 18.00 },
  { min: 150_000_001, max: 300_000_000, rate: 21.00 },
  { min: 300_000_001, max: 500_000_000, rate: 24.00 },
  { min: 500_000_001, max: Infinity, rate: 35.00 },
] as const;

// BPJS Ketenagakerjaan rates 2024
export const BPJS_TK_RATES = {
  JHT: { employee: 0.02, employer: 0.037 }, // Jaminan Hari Tua
  JP: { employee: 0.01, employer: 0.02 },   // Jaminan Pensiun
  JKK: { employer: 0.0024 },                // Jaminan Kecelakaan Kerja (risiko rendah)
  JKM: { employer: 0.003 },                 // Jaminan Kematian
} as const;

// BPJS Kesehatan rates 2024
export const BPJS_KES_RATES = {
  employee: 0.01,
  employer: 0.04,
} as const;

// Upper limit / cap salary untuk BPJS (2024)
export const BPJS_CAP = {
  jht: 12_167_200,    // Gaji maks JHT
  jp: 12_167_200,     // Gaji maks JP
  jkk: 12_167_200,    // Gaji maks JKK
  jkm: 12_167_200,    // Gaji maks JKM
  kesehatan: 12_167_200, // Gaji maks BPJS Kesehatan
} as const;

/**
 * Hitung PPh 21 menggunakan metode TER sesuai PMK 168/2023
 */
export function calculatePPh21TER(
  monthlyGross: number,
  ptkpCode: string, // e.g., "TK/0", "K/1"
  isDecember: boolean = false,
  previousMonthsGross: number = 0
): PPh21Result {
  // Parse PTKP code
  const [maritalStatus, dependents] = ptkpCode.split("/");
  const numDependents = parseInt(dependents) || 0;

  // Get PTKP value
  const ptkpKey = maritalStatus as keyof typeof PTKP_2024;
  const ptkpData = PTKP_2024[ptkpKey] || PTKP_2024.TK;
  const ptkpDeduction = (ptkpData as Record<string, number>)[String(Math.min(numDependents, 3))] || ptkpData["0"];

  // Determine TER type based on annual gross
  const annualGross = monthlyGross * 12;
  let terTable: readonly { min: number; max: number; rate: number }[];
  let pph21Type: "A" | "B" | "C";

  if (annualGross <= 500_000_000) {
    terTable = TER_A_MONTHLY;
    pph21Type = "A";
  } else if (annualGross <= 5_000_000_000) {
    terTable = TER_B_MONTHLY;
    pph21Type = "B";
  } else {
    terTable = TER_C_MONTHLY;
    pph21Type = "C";
  }

  let pph21: number;
  let effectiveRate: number;

  if (isDecember) {
    // Desember: hitung kumulatif seluruh tahun, kurangi yang sudah dipotong
    const annualGrossTotal = previousMonthsGross + monthlyGross;
    const annualPTKP = ptkpDeduction;

    // Cari bracket untuk penghasilan bruto bulanan rata-rata
    const avgMonthly = annualGrossTotal / 12;
    const bracket = terTable.find((b) => avgMonthly >= b.min && avgMonthly <= b.max);

    if (bracket) {
      const annualPph21 = annualGrossTotal * (bracket.rate / 100);
      pph21 = Math.max(0, annualPph21); // Sudah termasuk PTKP dalam tabel
      effectiveRate = bracket.rate;
    } else {
      pph21 = 0;
      effectiveRate = 0;
    }
  } else {
    // Bulanan: cari bracket berdasarkan penghasilan bruto bulanan
    const bracket = terTable.find((b) => monthlyGross >= b.min && monthlyGross <= b.max);

    if (bracket) {
      pph21 = monthlyGross * (bracket.rate / 100);
      effectiveRate = bracket.rate;
    } else {
      pph21 = 0;
      effectiveRate = 0;
    }
  }

  return {
    grossIncome: monthlyGross,
    ptkpDeduction,
    pkp: Math.max(0, monthlyGross - ptkpDeduction / 12),
    pph21: Math.round(pph21),
    pph21Type,
    effectiveRate,
  };
}

/**
 * Hitung BPJS Ketenagakerjaan
 */
export function calculateBPJSTK(
  baseSalary: number,
  allowances: number = 0
) {
  const taxableSalary = Math.min(baseSalary + allowances, BPJS_CAP.jht);

  return {
    jhtEmployee: Math.round(taxableSalary * BPJS_TK_RATES.JHT.employee),
    jhtEmployer: Math.round(taxableSalary * BPJS_TK_RATES.JHT.employer),
    jpEmployee: Math.round(taxableSalary * BPJS_TK_RATES.JP.employee),
    jpEmployer: Math.round(taxableSalary * BPJS_TK_RATES.JP.employer),
    jkk: Math.round(BPJS_CAP.jkk * BPJS_TK_RATES.JKK.employer),
    jkm: Math.round(BPJS_CAP.jkm * BPJS_TK_RATES.JKM.employer),
  };
}

/**
 * Hitung BPJS Kesehatan
 */
export function calculateBPJSKes(
  baseSalary: number,
  allowances: number = 0
) {
  const cappedSalary = Math.min(baseSalary + allowances, BPJS_CAP.kesehatan);

  return {
    employee: Math.round(cappedSalary * BPJS_KES_RATES.employee),
    employer: Math.round(cappedSalary * BPJS_KES_RATES.employer),
  };
}

/**
 * Hitung THR (Tunjangan Hari Raya)
 * THR = 1 bulan gaji untuk karyawan yang sudah bekerja ≥ 12 bulan
 */
export function calculateTHR(
  baseSalary: number,
  monthsWorked: number,
  ptkpCode: string = "TK/0"
) {
  if (monthsWorked < 12) {
    const prorated = (baseSalary / 12) * monthsWorked;
    const pph21 = calculatePPh21TER(prorated, ptkpCode, false, 0);
    return {
      amount: Math.round(prorated),
      pph21: pph21.pph21,
      netAmount: Math.round(prorated - pph21.pph21),
    };
  }

  const pph21 = calculatePPh21TER(baseSalary, ptkpCode, false, 0);
  return {
    amount: Math.round(baseSalary),
    pph21: pph21.pph21,
    netAmount: Math.round(baseSalary - pph21.pph21),
  };
}

/**
 * Hitung total gaji bersih
 */
export function calculateNetSalary(
  baseSalary: number,
  allowance: number,
  deduction: number,
  overtime: number,
  bonus: number,
  thr: number,
  pph21: number,
  bpjs: {
    jhtEmployee: number;
    jpEmployee: number;
    kesehatanEmployee: number;
  }
) {
  const totalIncome = baseSalary + allowance + overtime + bonus + thr;
  const totalDeduction =
    deduction +
    pph21 +
    bpjs.jhtEmployee +
    bpjs.jpEmployee +
    bpjs.kesehatanEmployee;

  return {
    grossIncome: totalIncome,
    totalDeduction,
    netSalary: Math.max(0, totalIncome - totalDeduction),
  };
}
