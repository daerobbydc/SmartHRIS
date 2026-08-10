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

// TER A - Status PTKP: TK/0, TK/1, K/0
export const TER_A_MONTHLY = [
  { min: 0, max: 5_400_000, rate: 0 },
  { min: 5_400_001, max: 5_650_000, rate: 0.25 },
  { min: 5_650_001, max: 5_950_000, rate: 0.50 },
  { min: 5_950_001, max: 6_300_000, rate: 0.75 },
  { min: 6_300_001, max: 6_750_000, rate: 1.00 },
  { min: 6_750_001, max: 7_250_000, rate: 1.25 },
  { min: 7_250_001, max: 7_750_000, rate: 1.50 },
  { min: 7_750_001, max: 8_300_000, rate: 1.75 },
  { min: 8_300_001, max: 8_900_000, rate: 2.00 },
  { min: 8_900_001, max: 9_600_000, rate: 2.25 },
  { min: 9_600_001, max: 10_050_000, rate: 2.50 },
  { min: 10_050_001, max: 10_550_000, rate: 3.00 },
  { min: 10_550_001, max: 11_350_000, rate: 3.50 },
  { min: 11_350_001, max: 12_200_000, rate: 4.00 },
  { min: 12_200_001, max: 13_200_000, rate: 5.00 },
  { min: 13_200_001, max: 14_300_000, rate: 6.00 },
  { min: 14_300_001, max: 15_600_000, rate: 7.00 },
  { min: 15_600_001, max: 17_050_000, rate: 8.00 },
  { min: 17_050_001, max: 18_750_000, rate: 9.00 },
  { min: 18_750_001, max: 20_700_000, rate: 10.00 },
  { min: 20_700_001, max: 23_000_000, rate: 11.00 },
  { min: 23_000_001, max: 25_700_000, rate: 12.00 },
  { min: 25_700_001, max: 29_000_000, rate: 13.00 },
  { min: 29_000_001, max: 33_000_000, rate: 14.00 },
  { min: 33_000_001, max: 37_800_000, rate: 15.00 },
  { min: 37_800_001, max: 43_700_000, rate: 17.00 },
  { min: 43_700_001, max: 50_800_000, rate: 19.00 },
  { min: 50_800_001, max: 59_400_000, rate: 21.00 },
  { min: 59_400_001, max: 70_200_000, rate: 23.00 },
  { min: 70_200_001, max: 84_100_000, rate: 25.00 },
  { min: 84_100_001, max: 102_500_000, rate: 27.00 },
  { min: 102_500_001, max: 140_000_000, rate: 30.00 },
  { min: 140_000_001, max: Infinity, rate: 34.00 },
] as const;

// TER B - Status PTKP: TK/2, TK/3, K/1, K/2
export const TER_B_MONTHLY = [
  { min: 0, max: 6_200_000, rate: 0 },
  { min: 6_200_001, max: 6_500_000, rate: 0.25 },
  { min: 6_500_001, max: 6_850_000, rate: 0.50 },
  { min: 6_850_001, max: 7_300_000, rate: 0.75 },
  { min: 7_300_001, max: 7_800_000, rate: 1.00 },
  { min: 7_800_001, max: 8_350_000, rate: 1.25 },
  { min: 8_350_001, max: 9_000_000, rate: 1.50 },
  { min: 9_000_001, max: 9_700_000, rate: 1.75 },
  { min: 9_700_001, max: 10_500_000, rate: 2.00 },
  { min: 10_500_001, max: 11_450_000, rate: 2.25 },
  { min: 11_450_001, max: 12_500_000, rate: 2.50 },
  { min: 12_500_001, max: 13_750_000, rate: 3.00 },
  { min: 13_750_001, max: 15_100_000, rate: 4.00 },
  { min: 15_100_001, max: 16_650_000, rate: 5.00 },
  { min: 16_650_001, max: 18_450_000, rate: 6.00 },
  { min: 18_450_001, max: 20_550_000, rate: 7.00 },
  { min: 20_550_001, max: 23_000_000, rate: 8.00 },
  { min: 23_000_001, max: 25_900_000, rate: 9.00 },
  { min: 25_900_001, max: 29_300_000, rate: 10.00 },
  { min: 29_300_001, max: 33_300_000, rate: 11.00 },
  { min: 33_300_001, max: 38_000_000, rate: 12.00 },
  { min: 38_000_001, max: 43_600_000, rate: 13.00 },
  { min: 43_600_001, max: 50_400_000, rate: 14.00 },
  { min: 50_400_001, max: 58_700_000, rate: 15.00 },
  { min: 58_700_001, max: 68_800_000, rate: 17.00 },
  { min: 68_800_001, max: 81_300_000, rate: 19.00 },
  { min: 81_300_001, max: 97_000_000, rate: 21.00 },
  { min: 97_000_001, max: 117_700_000, rate: 23.00 },
  { min: 117_700_001, max: 145_400_000, rate: 25.00 },
  { min: 145_400_001, max: 184_200_000, rate: 27.00 },
  { min: 184_200_001, max: 241_900_000, rate: 30.00 },
  { min: 241_900_001, max: Infinity, rate: 34.00 },
] as const;

// TER C - Status PTKP: K/3
export const TER_C_MONTHLY = [
  { min: 0, max: 6_600_000, rate: 0 },
  { min: 6_600_001, max: 6_950_000, rate: 0.25 },
  { min: 6_950_001, max: 7_350_000, rate: 0.50 },
  { min: 7_350_001, max: 7_800_000, rate: 0.75 },
  { min: 7_800_001, max: 8_350_000, rate: 1.00 },
  { min: 8_350_001, max: 8_950_000, rate: 1.25 },
  { min: 8_950_001, max: 9_650_000, rate: 1.50 },
  { min: 9_650_001, max: 10_400_000, rate: 1.75 },
  { min: 10_400_001, max: 11_250_000, rate: 2.00 },
  { min: 11_250_001, max: 12_250_000, rate: 2.25 },
  { min: 12_250_001, max: 13_400_000, rate: 2.50 },
  { min: 13_400_001, max: 14_700_000, rate: 3.00 },
  { min: 14_700_001, max: 16_150_000, rate: 4.00 },
  { min: 16_150_001, max: 17_800_000, rate: 5.00 },
  { min: 17_800_001, max: 19_750_000, rate: 6.00 },
  { min: 19_750_001, max: 22_000_000, rate: 7.00 },
  { min: 22_000_001, max: 24_600_000, rate: 8.00 },
  { min: 24_600_001, max: 27_700_000, rate: 9.00 },
  { min: 27_700_001, max: 31_400_000, rate: 10.00 },
  { min: 31_400_001, max: 35_700_000, rate: 11.00 },
  { min: 35_700_001, max: 40_700_000, rate: 12.00 },
  { min: 40_700_001, max: 46_700_000, rate: 13.00 },
  { min: 46_700_001, max: 54_000_000, rate: 14.00 },
  { min: 54_000_001, max: 62_900_000, rate: 15.00 },
  { min: 62_900_001, max: 73_700_000, rate: 17.00 },
  { min: 73_700_001, max: 87_100_000, rate: 19.00 },
  { min: 87_100_001, max: 104_000_000, rate: 21.00 },
  { min: 104_000_001, max: 126_100_000, rate: 23.00 },
  { min: 126_100_001, max: 155_900_000, rate: 25.00 },
  { min: 155_900_001, max: 197_500_000, rate: 27.00 },
  { min: 197_500_001, max: 259_300_000, rate: 30.00 },
  { min: 259_300_001, max: Infinity, rate: 34.00 },
] as const;

// BPJS Ketenagakerjaan rates 2024 / 2025
export const BPJS_TK_RATES = {
  JHT: { employee: 0.02, employer: 0.037 }, // Jaminan Hari Tua
  JP: { employee: 0.01, employer: 0.02 },   // Jaminan Pensiun
  JKK: { employer: 0.0024 },                // Jaminan Kecelakaan Kerja (risiko sangat rendah)
  JKM: { employer: 0.003 },                 // Jaminan Kematian
} as const;

// BPJS Kesehatan rates 2024 / 2025
export const BPJS_KES_RATES = {
  employee: 0.01,
  employer: 0.04,
} as const;

// Upper limit / cap salary untuk BPJS
export const BPJS_CAP = {
  jht: Infinity,        // JHT tidak ada cap atas
  jp: 10_547_400,       // Gaji maks JP 2024/2025
  jkk: Infinity,
  jkm: Infinity,
  kesehatan: 12_000_000, // Gaji maks BPJS Kesehatan
} as const;

/**
 * Hitung PPh 21 menggunakan metode TER resmi PMK 168/2023
 */
export function calculatePPh21TER(
  monthlyGross: number,
  ptkpCode: string = "TK/0",
  isDecember: boolean = false,
  previousMonthsGross: number = 0
): PPh21Result {
  const normalizedPtkp = ptkpCode.trim().toUpperCase();

  // Tentukan kategori TER berdasarkan Status PTKP (PMK 168/2023):
  // TER A: TK/0, TK/1, K/0
  // TER B: TK/2, TK/3, K/1, K/2
  // TER C: K/3
  let terTable: readonly { min: number; max: number; rate: number }[];
  let pph21Type: "A" | "B" | "C";

  if (["TK/0", "TK/1", "K/0"].includes(normalizedPtkp)) {
    terTable = TER_A_MONTHLY;
    pph21Type = "A";
  } else if (["TK/2", "TK/3", "K/1", "K/2"].includes(normalizedPtkp)) {
    terTable = TER_B_MONTHLY;
    pph21Type = "B";
  } else if (["K/3"].includes(normalizedPtkp)) {
    terTable = TER_C_MONTHLY;
    pph21Type = "C";
  } else {
    // Default fallback to TER A
    terTable = TER_A_MONTHLY;
    pph21Type = "A";
  }

  // Parse PTKP Amount for annual deduction
  const [maritalStatus, dependents] = normalizedPtkp.split("/");
  const numDependents = parseInt(dependents) || 0;
  const ptkpKey = (maritalStatus || "TK") as keyof typeof PTKP_2024;
  const ptkpData = PTKP_2024[ptkpKey] || PTKP_2024.TK;
  const ptkpDeduction = (ptkpData as Record<string, number>)[String(Math.min(numDependents, 3))] || 54_000_000;

  let pph21: number;
  let effectiveRate: number;

  if (isDecember) {
    // Desember: hitung PPh 21 Pasal 17 (Penghasilan Bruto Setahun - PTKP) - PPh 21 TER Jan-Nov yang sudah dipotong
    const annualGrossTotal = previousMonthsGross + monthlyGross;
    const pkp = Math.max(0, annualGrossTotal - ptkpDeduction);

    // Tarip Pasal 17 UU HPP
    let annualTax = 0;
    if (pkp <= 60_000_000) {
      annualTax = pkp * 0.05;
    } else if (pkp <= 250_000_000) {
      annualTax = 60_000_000 * 0.05 + (pkp - 60_000_000) * 0.15;
    } else if (pkp <= 500_000_000) {
      annualTax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + (pkp - 250_000_000) * 0.25;
    } else if (pkp <= 5_000_000_000) {
      annualTax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + (pkp - 500_000_000) * 0.30;
    } else {
      annualTax = 60_000_000 * 0.05 + 190_000_000 * 0.15 + 250_000_000 * 0.25 + 4_500_000_000 * 0.30 + (pkp - 5_000_000_000) * 0.35;
    }

    pph21 = Math.max(0, annualTax);
    effectiveRate = monthlyGross > 0 ? (pph21 / monthlyGross) * 100 : 0;
  } else {
    // Jan-Nov: Cari bracket TER berdasarkan penghasilan bruto bulanan
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
  const grossSalary = baseSalary + allowances;
  const jpSalary = Math.min(grossSalary, BPJS_CAP.jp);

  return {
    jhtEmployee: Math.round(grossSalary * BPJS_TK_RATES.JHT.employee),
    jhtEmployer: Math.round(grossSalary * BPJS_TK_RATES.JHT.employer),
    jpEmployee: Math.round(jpSalary * BPJS_TK_RATES.JP.employee),
    jpEmployer: Math.round(jpSalary * BPJS_TK_RATES.JP.employer),
    jkk: Math.round(grossSalary * BPJS_TK_RATES.JKK.employer),
    jkm: Math.round(grossSalary * BPJS_TK_RATES.JKM.employer),
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
