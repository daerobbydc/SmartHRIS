import { prisma } from "@/lib/prisma";

export interface BoxMatrixCategory {
  boxNumber: number; // 1 to 9
  title: string;
  category: "Star" | "High Potential" | "Solid Professional" | "Core Player" | "Specialist" | "Enigma" | "Dilemma" | "Risk";
  description: string;
  recommendation: string;
  badgeColor: string;
}

/**
 * 9-Box Matrix Categories Dictionary
 */
export const NINE_BOX_DICTIONARY: Record<number, BoxMatrixCategory> = {
  9: {
    boxNumber: 9,
    title: "Star / Top Talent",
    category: "Star",
    description: "Kinerja Sangat Tinggi (High) & Potensi Sangat Tinggi (High).",
    recommendation: "Kandidat prioritas suksesi kepemimpinan/promosi, berikan tantangan strategis & retensi khusus.",
    badgeColor: "bg-emerald-500 text-white",
  },
  8: {
    boxNumber: 8,
    title: "High Performer",
    category: "High Potential",
    description: "Kinerja Sangat Tinggi (High) & Potensi Sedang (Medium).",
    recommendation: "Berikan kesempatan pengembangan kepemimpinan dan proyek percontohan.",
    badgeColor: "bg-teal-500 text-white",
  },
  7: {
    boxNumber: 7,
    title: "Solid Professional",
    category: "Solid Professional",
    description: "Kinerja Sangat Tinggi (High) & Potensi Rendah (Low).",
    recommendation: "Pertahankan dalam peran spesialis kunci, berikan apresiasi atas konsistensi kerja.",
    badgeColor: "bg-cyan-600 text-white",
  },
  6: {
    boxNumber: 6,
    title: "High Potential",
    category: "High Potential",
    description: "Kinerja Sedang (Medium) & Potensi Sangat Tinggi (High).",
    recommendation: "Berikan mentoring & coaching ketat untuk meningkatkan hasil kinerja ke tingkat Star.",
    badgeColor: "bg-teal-600 text-white",
  },
  5: {
    boxNumber: 5,
    title: "Core Player",
    category: "Core Player",
    description: "Kinerja Sedang (Medium) & Potensi Sedang (Medium).",
    recommendation: "Tulang punggung tim. Berikan pelatihan keterampilan teknis dan motivasi rutin.",
    badgeColor: "bg-slate-600 text-white",
  },
  4: {
    boxNumber: 4,
    title: "Effective Specialist",
    category: "Specialist",
    description: "Kinerja Sedang (Medium) & Potensi Rendah (Low).",
    recommendation: "Fokus pada stabilisasi peran harian dan efisiensi prosedur operasional.",
    badgeColor: "bg-slate-500 text-white",
  },
  3: {
    boxNumber: 3,
    title: "Enigma / Unapped Potential",
    category: "Enigma",
    description: "Kinerja Rendah (Low) & Potensi Sangat Tinggi (High).",
    recommendation: "Evaluasi hambatan kerja, cocokkan ulang posisi/job-fit, atau pindahkan ke tim baru.",
    badgeColor: "bg-amber-500 text-white",
  },
  2: {
    boxNumber: 2,
    title: "Dilemma",
    category: "Dilemma",
    description: "Kinerja Rendah (Low) & Potensi Sedang (Medium).",
    recommendation: "Tetapkan target Performance Improvement Plan (PIP) jangka pendek (3 bulan).",
    badgeColor: "bg-amber-600 text-white",
  },
  1: {
    boxNumber: 1,
    title: "Underperformer / Risk",
    category: "Risk",
    description: "Kinerja Rendah (Low) & Potensi Rendah (Low).",
    recommendation: "Berikan peringatan resmi PIP, jika tidak ada perbaikan pertimbangkan offboarding.",
    badgeColor: "bg-red-500 text-white",
  },
};

/**
 * Compute Box Number (1-9) from Performance Rating (1-3) & Potential Rating (1-3)
 */
export function calculateBoxNumber(performance: number, potential: number): number {
  const perf = Math.min(3, Math.max(1, performance));
  const pot = Math.min(3, Math.max(1, potential));

  if (perf === 3 && pot === 3) return 9;
  if (perf === 3 && pot === 2) return 8;
  if (perf === 3 && pot === 1) return 7;
  if (perf === 2 && pot === 3) return 6;
  if (perf === 2 && pot === 2) return 5;
  if (perf === 2 && pot === 1) return 4;
  if (perf === 1 && pot === 3) return 3;
  if (perf === 1 && pot === 2) return 2;
  return 1;
}

/**
 * Save or update employee 9-box rating
 */
export async function saveTalentMatrixRating(
  employeeId: string,
  performanceRating: number,
  potentialRating: number,
  year: number = new Date().getFullYear(),
  notes?: string,
  assessedBy?: string
) {
  const boxNumber = calculateBoxNumber(performanceRating, potentialRating);
  const info = NINE_BOX_DICTIONARY[boxNumber];

  return await prisma.talentMatrix9Box.upsert({
    where: {
      employeeId_year: { employeeId, year },
    },
    create: {
      employeeId,
      performanceRating,
      potentialRating,
      boxNumber,
      boxCategory: info.category,
      notes,
      assessedBy,
      year,
    },
    update: {
      performanceRating,
      potentialRating,
      boxNumber,
      boxCategory: info.category,
      notes,
      assessedBy,
    },
    include: {
      employee: { select: { firstName: true, lastName: true, department: true, position: true } },
    },
  });
}
