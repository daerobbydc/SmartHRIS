import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ==================== ONBOARDING / OFFBOARDING ====================

export interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  assignedTo: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  notes: string | null;
}

export interface OnboardingProgress {
  employeeId: string;
  employeeName: string;
  hireDate: Date;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  byCategory: Record<string, { total: number; completed: number }>;
}

/**
 * Default onboarding tasks by category
 */
export const DEFAULT_ONBOARDING_TASKS = {
  PRE_ARRIVAL: [
    "Kirim email welcome & akun sistem",
    "Siapkan peralatan kerja (laptop, HP, access card)",
    "Siapkan meja dan kursi kerja",
    "Daftarkan ke BPJS Ketenagakerjaan & Kesehatan",
    "Siapkan kontrak kerja",
    "Setup email & akun Google Workspace",
  ],
  FIRST_DAY: [
    "Orientation kantor & fasilitas",
    "Perkenalan dengan tim",
    "Tour kantor (ruang kerja, pantry, toilet, meeting room)",
    "Serahkan peralatan kerja",
    "Jelaskan aturan & budaya perusahaan",
    "Foto untuk ID card",
  ],
  FIRST_WEEK: [
    "Training sistem (SmartHRIS, email, dll)",
    "Meeting dengan direct manager",
    "Review job description & KPI",
    "Setup akses sistem & tools",
    "Meet & greet dengan stakeholder",
    "Baca employee handbook",
  ],
  FIRST_MONTH: [
    "Weekly check-in dengan manager",
    "Review performa awal",
    "Feedback session dengan HR",
    "Tentukan mentor/buddy",
    "Evaluasi masa percobaan",
    "Rencana pengembangan 3 bulan pertama",
  ],
};

/**
 * Default offboarding tasks by category
 */
export const DEFAULT_OFFBOARDING_TASKS = {
  RESIGNATION: [
    "Terima surat pengunduran diri",
    "Interview keluar (exit interview)",
    "Proses penggantian posisi",
    "Dokumentasi alasan resign",
  ],
  TERMINATION: [
    "Dokumentasi alasan terminasi",
    "Proses sesuai ketenagakerjaan",
    "Konsultasi legal",
    "Surat pemberitahuan",
  ],
  CLEARANCE: [
    "Kembalikan semua aset kantor",
    "Tutup akses sistem & email",
    "Kembalikan ID card & access card",
    "KlaimBPJS & dokumen lainnya",
    "Proses settlement gaji terakhir",
    "Buat surat keterangan kerja",
  ],
  EXIT_INTERVIEW: [
    "Wawancara exit interview",
    "Survey kepuasan kerja",
    "Dokumentasi feedback",
    "Rekomendasi perbaikan",
  ],
};

/**
 * Get onboarding checklist for an employee
 */
export async function getOnboardingChecklist(
  employeeId: string
): Promise<ChecklistItem[]> {
  const items = await p.onboardingChecklist.findMany({
    where: { employeeId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return items;
}

/**
 * Get offboarding checklist for an employee
 */
export async function getOffboardingChecklist(
  employeeId: string
): Promise<ChecklistItem[]> {
  const items = await p.offboardingChecklist.findMany({
    where: { employeeId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return items;
}

/**
 * Initialize onboarding checklist for a new employee
 */
export async function initializeOnboarding(
  employeeId: string
): Promise<number> {
  let count = 0;

  for (const [category, tasks] of Object.entries(DEFAULT_ONBOARDING_TASKS)) {
    for (const task of tasks) {
      await p.onboardingChecklist.create({
        data: {
          employeeId,
          task,
          category: category as "PRE_ARRIVAL" | "FIRST_DAY" | "FIRST_WEEK" | "FIRST_MONTH",
        },
      });
      count++;
    }
  }

  return count;
}

/**
 * Initialize offboarding checklist for a leaving employee
 */
export async function initializeOffboarding(
  employeeId: string,
  type: "RESIGNATION" | "TERMINATION" = "RESIGNATION"
): Promise<number> {
  let count = 0;

  const tasks = {
    RESIGNATION: [
      ...DEFAULT_OFFBOARDING_TASKS.RESIGNATION,
      ...DEFAULT_OFFBOARDING_TASKS.CLEARANCE,
      ...DEFAULT_OFFBOARDING_TASKS.EXIT_INTERVIEW,
    ],
    TERMINATION: [
      ...DEFAULT_OFFBOARDING_TASKS.TERMINATION,
      ...DEFAULT_OFFBOARDING_TASKS.CLEARANCE,
      ...DEFAULT_OFFBOARDING_TASKS.EXIT_INTERVIEW,
    ],
  };

  for (const task of tasks[type]) {
    const category = task.includes("asuransi") || task.includes("BPJS") || task.includes("settlement")
      ? "CLEARANCE"
      : task.includes("exit") || task.includes("wawancara")
      ? "EXIT_INTERVIEW"
      : type === "TERMINATION"
      ? "TERMINATION"
      : "RESIGNATION";

    await p.offboardingChecklist.create({
      data: {
        employeeId,
        task,
        category: category as "RESIGNATION" | "TERMINATION" | "CLEARANCE" | "EXIT_INTERVIEW",
      },
    });
    count++;
  }

  return count;
}

/**
 * Complete a checklist item
 */
export async function completeChecklistItem(
  id: string,
  type: "onboarding" | "offboarding",
  notes?: string
): Promise<boolean> {
  try {
    if (type === "onboarding") {
      await p.onboardingChecklist.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          notes,
        },
      });
    } else {
      await p.offboardingChecklist.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          notes,
        },
      });
    }
    return true;
  } catch (error) {
    console.error("Complete checklist error:", error);
    return false;
  }
}

/**
 * Get onboarding progress for an employee
 */
export async function getOnboardingProgress(
  employeeId: string
): Promise<OnboardingProgress> {
  const employee = await p.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true, lastName: true, hireDate: true },
  });

  const items = await getOnboardingChecklist(employeeId);

  const byCategory: Record<string, { total: number; completed: number }> = {};
  items.forEach((item) => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = { total: 0, completed: 0 };
    }
    byCategory[item.category].total++;
    if (item.isCompleted) {
      byCategory[item.category].completed++;
    }
  });

  const completedTasks = items.filter((i) => i.isCompleted).length;

  return {
    employeeId,
    employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "",
    hireDate: employee?.hireDate || new Date(),
    totalTasks: items.length,
    completedTasks,
    progress: items.length > 0 ? Math.round((completedTasks / items.length) * 100) : 0,
    byCategory,
  };
}
