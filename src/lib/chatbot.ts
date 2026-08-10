import { prisma } from "@/lib/prisma";

// ==================== CHATBOT / VIRTUAL ASSISTANT ====================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  type: "info" | "action" | "error";
  data?: Record<string, unknown>;
}

// Knowledge base for FAQ
const KNOWLEDGE_BASE: { keywords: string[]; answer: string; category: string }[] = [
  {
    keywords: ["cuti", "leave", "libur", "vacation"],
    answer: "Untuk mengajukan cuti, silakan menuju menu Self Service > Pengajuan. Pilih tipe cuti (Annual, Sick, Personal, dll), isi tanggal dan alasan. Pengajuan akan dikirim ke manager untuk approval.",
    category: "leave",
  },
  {
    keywords: ["gaji", "salary", "payroll", " THR"],
    answer: "Informasi gaji dapat dilihat di menu Layanana > Gaji. Slip gaji tersedia setiap akhir bulan. THR diberikan menjelang hari raya sesuai ketentuan perusahaan.",
    category: "payroll",
  },
  {
    keywords: ["absen", "attendance", "check-in", "check-out", "clock in"],
    answer: "Untuk absen online, gunakan menu Absensi > Absen Online. Pastikan GPS aktif dan Anda berada di dalam radius kantor (100m). Jam kerja standar: 08:00 - 17:00.",
    category: "attendance",
  },
  {
    keywords: ["lembur", "overtime", "kerja extra"],
    answer: "Pengajuan lembur dapat dilakukan di menu Absensi > Lembur. Lembur harus disetujui oleh manager. Pembayaran lembur akan digabung dengan gaji bulanan.",
    category: "overtime",
  },
  {
    keywords: ["jadwal", "schedule", "shift", "roster"],
    answer: "Jadwal kerja dapat dilihat di menu Absensi > Jadwal. Shift dan roster dikelola oleh HR. Untuk perubahan jadwal, hubungi HR atau gunakan Self Service.",
    category: "schedule",
  },
  {
    keywords: ["performance", "penilaian", "review", "evaluasi"],
    answer: "Penilaian performa dilakukan setiap kuartal. Hasil dapat dilihat di menu Penilaian > Tugas. Feedback 360 derajat tersedia di menu Penilaian > Feedback.",
    category: "performance",
  },
  {
    keywords: ["karyawan", "employee", "data pribadi", "profil"],
    answer: "Data pribadi karyawan dapat dilihat dan diperbarui di profil. Untuk perubahan data penting (nama, NPWP, rekening bank), silakan ajukan permintaan ke HR.",
    category: "employee",
  },
  {
    keywords: ["bpjs", "kesehatan", "ketenagakerjaan", "insurance"],
    answer: "BPJS Kesehatan dan Ketenagakerjaan otomatis dipotong dari gaji. Rincian dapat dilihat di slip gaji. Untuk klaim BPJS, silakan hubungi HR.",
    category: "benefits",
  },
  {
    keywords: ["pajak", "tax", "pph21", "npwp"],
    answer: "PPh 21 dihitung menggunakan metode TER (Tarif Efektif Rata-rata) sesuai PMK 168/2023. Rincian terdapat di slip gaji. Untuk pertanyaan pajak, hubungi tim Finance.",
    category: "tax",
  },
  {
    keywords: ["kontak", "hubungi", "email", "telepon", "help", "bantuan"],
    answer: "Untuk bantuan lebih lanjut:\n- HR: hr@smarthris.com\n- IT Support: it@smarthris.com\n- Finance: finance@smarthris.com\n- Emergency: 021-XXXX-XXXX",
    category: "contact",
  },
];

/**
 * Process chat message and generate response
 */
export async function processChatMessage(
  message: string,
  userId: string
): Promise<ChatResponse> {
  const lowerMessage = message.toLowerCase();

  // 1. Query live KnowledgeBase table from DB
  const dbKnowledge = await prisma.knowledgeBase.findMany({
    where: { isPublished: true },
  });

  const matchingDoc = dbKnowledge.find(
    (doc) =>
      lowerMessage.includes(doc.title.toLowerCase()) ||
      (doc.tags && doc.tags.toLowerCase().split(",").some((tag) => lowerMessage.includes(tag.trim()))) ||
      lowerMessage.includes(doc.category.toLowerCase())
  );

  if (matchingDoc) {
    return {
      message: `📄 **${matchingDoc.title}** (${matchingDoc.category})\n\n${matchingDoc.content.slice(0, 500)}${matchingDoc.content.length > 500 ? "..." : ""}`,
      type: "info",
      data: { id: matchingDoc.id, title: matchingDoc.title, category: matchingDoc.category },
    };
  }

  // 2. Static Knowledge Base fallback
  for (const kb of KNOWLEDGE_BASE) {
    if (kb.keywords.some((kw) => lowerMessage.includes(kw))) {
      return {
        message: kb.answer,
        type: "info",
      };
    }
  }

  // 3. User Specific Queries: Leave Balances
  if (
    lowerMessage.includes("sisa cuti") ||
    lowerMessage.includes("remaining leave") ||
    lowerMessage.includes("jatah cuti")
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (user?.employee) {
      const currentYear = new Date().getFullYear();

      // Check LeaveBalance table first
      const balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId: user.employee.id,
          year: currentYear,
        },
      });

      if (balances.length > 0) {
        const details = balances
          .map((b) => {
            const rem = b.total + (b.carried || 0) - b.used - (b.pending || 0);
            return `• ${b.leaveType}: Total ${b.total} hari | Terpakai ${b.used} hari | Sisa ${rem} hari`;
          })
          .join("\n");

        return {
          message: `📊 **Sisa Cuti Tahun ${currentYear} (${user.employee.firstName})**:\n\n${details}`,
          type: "info",
          data: { balances },
        };
      }

      // Fallback calculation from Leave records
      const leaveCount = await prisma.leave.count({
        where: {
          employeeId: user.employee.id,
          type: "ANNUAL",
          status: "APPROVED",
          startDate: { gte: new Date(currentYear, 0, 1) },
        },
      });

      const totalQuota = 12;
      const remaining = totalQuota - leaveCount;

      return {
        message: `📊 **Cuti Tahunan ${currentYear} (${user.employee.firstName})**:\n\n• Kuota Kuota: ${totalQuota} hari\n• Sudah Digunakan: ${leaveCount} hari\n• Sisa Cuti: **${remaining} hari**`,
        type: "info",
        data: { used: leaveCount, remaining, total: totalQuota },
      };
    }
  }

  // 4. User Specific Queries: Salary & Payroll
  if (
    lowerMessage.includes("gaji saya") ||
    lowerMessage.includes("my salary") ||
    lowerMessage.includes("slip gaji")
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (user?.employee) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const payroll = await prisma.payroll.findFirst({
        where: {
          employeeId: user.employee.id,
          month: currentMonth,
          year: currentYear,
        },
      });

      if (payroll) {
        return {
          message: `💵 **Gaji Bulan ${new Date(currentYear, currentMonth - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}**:\n\n• Gaji Pokok: Rp ${Number(payroll.baseSalary).toLocaleString("id-ID")}\n• Tunjangan: Rp ${Number(payroll.allowance).toLocaleString("id-ID")}\n• PPh 21 TER: Rp ${Number(payroll.pph21).toLocaleString("id-ID")}\n• Total Potongan: Rp ${Number(payroll.totalDeduction).toLocaleString("id-ID")}\n• **Gaji Bersih (Take Home Pay)**: **Rp ${Number(payroll.netSalary).toLocaleString("id-ID")}**\n\n_Slip Gaji lengkap dapat diunduh di menu ESS > Slip Gaji._`,
          type: "info",
          data: payroll,
        };
      } else {
        return {
          message: `Belum ada rincian data gaji terproses untuk bulan ${new Date().toLocaleDateString("id-ID", { month: "long" })}. Silakan hubungi HR/Payroll jika membutuhkan konfirmasi.`,
          type: "info",
        };
      }
    }
  }

  if (lowerMessage.includes("jam kerja") || lowerMessage.includes("work hours") || lowerMessage.includes("shift")) {
    return {
      message: "⏰ **Ketentuan Jam Kerja SmartHRIS**:\n\n📅 **Office Hours**: Senin - Jumat, 08:00 - 17:00 (Istirahat 12:00 - 13:00)\n⌛ **Toleransi Keterlambatan (Grace Period)**: 15 menit\n📍 **Lokasi Absensi**: Geofencing radius 100 meter dari titik kantor yang ditentukan.",
      type: "info",
    };
  }

  // Default response
  return {
    message: "Maaf, saya belum menemukan jawaban yang tepat. Anda dapat mencoba menanyakan hal berikut:\n\n• *\"Berapa sisa cuti saya?\"*\n• *\"Rincian slip gaji bulan ini\"*\n• *\"SOP lembur dan jam kerja\"*\n• *\"Aturan klaim BPJS & Asuransi\"*",
    type: "info",
  };
}

/**
 * Get chat suggestions based on context
 */
export async function getChatSuggestions(userId: string): Promise<string[]> {
  const suggestions = [
    "Sisa cuti saya berapa?",
    "Cara mengajukan cuti?",
    "Lihat gaji bulan ini",
    "Jam kerja berapa?",
    "Cara absen online?",
    "Ajukan lembur",
  ];

  return suggestions;
}

/**
 * Get quick actions based on user role
 */
export async function getQuickActions(role: string): Promise<{ label: string; action: string; icon: string }[]> {
  const baseActions = [
    { label: "Ajukan Cuti", action: "leave_request", icon: "calendar" },
    { label: "Absen Online", action: "attendance", icon: "clock" },
    { label: "Lihat Gaji", action: "payroll", icon: "dollar" },
  ];

  if (role === "HR" || role === "ADMIN") {
    baseActions.push(
      { label: "Approve Cuti", action: "approve_leave", icon: "check" },
      { label: "Lihat Laporan", action: "reports", icon: "chart" }
    );
  }

  if (role === "MANAGER") {
    baseActions.push(
      { label: "Review Tim", action: "team_review", icon: "users" }
    );
  }

  return baseActions;
}
