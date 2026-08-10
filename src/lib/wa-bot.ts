import { prisma } from "@/lib/prisma";

export interface WAPayload {
  phone: string;
  message: string;
  type?: "APPROVAL_ALERT" | "ATTENDANCE_REMINDER" | "PAYSLIP_LINK";
}

/**
 * Format and dispatch WhatsApp notification via configured Gateway URL / Webhook
 */
export async function sendWhatsAppMessage(payload: WAPayload): Promise<{ success: boolean; logId: string; response?: any }> {
  const formattedPhone = formatPhoneNumber(payload.phone);
  const gatewayUrl = process.env.WA_GATEWAY_URL || "https://api.fonnte.com/send"; // Default Fonnte / Wablas gateway format
  const apiKey = process.env.WA_GATEWAY_KEY || "DEMO_WA_KEY";

  console.log(`[WhatsApp Bot] Sending ${payload.type || "NOTIFICATION"} to ${formattedPhone}`);

  try {
    let responseData = { status: "simulated_success", phone: formattedPhone, timestamp: new Date() };

    // Real fetch call if gateway URL is configured
    if (process.env.WA_GATEWAY_URL && process.env.WA_GATEWAY_KEY) {
      const res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          target: formattedPhone,
          message: payload.message,
        }),
      });
      responseData = await res.json();
    }

    return {
      success: true,
      logId: `WA-${Date.now()}`,
      response: responseData,
    };
  } catch (error) {
    console.error("WhatsApp dispatch error:", error);
    return {
      success: false,
      logId: `WA-ERR-${Date.now()}`,
      response: { error: "Failed to dispatch WhatsApp payload" },
    };
  }
}

/**
 * Helper to format phone number to international format (628xxx)
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Template 1: Approval Alert for Managers (Cuti, Lembur, Tukar Shift)
 */
export function buildApprovalWATemplate(params: {
  managerName: string;
  employeeName: string;
  requestType: "Cuti" | "Lembur" | "Tukar Shift" | "Perjalanan Dinas";
  details: string;
  approvalLink?: string;
}): string {
  return (
    `🔔 *Pemberitahuan Persetujuan SmartHRIS*\n\n` +
    `Halo Bpk/Ibu *${params.managerName}*,\n` +
    `Terdapat pengajuan *${params.requestType}* baru dari karyawan *${params.employeeName}* yang memerlukan persetujuan Anda.\n\n` +
    `📋 *Rincian Pengajuan*:\n${params.details}\n\n` +
    `Silakan buka portal SmartHRIS untuk meninjau dan memberikan persetujuan:\n` +
    `👉 ${params.approvalLink || "http://localhost:3000/ess/approval"}\n\n` +
    `_Pesan ini dikirimkan otomatis oleh SmartHRIS Notification Bot._`
  );
}

/**
 * Template 2: Attendance Reminder for Employees
 */
export function buildAttendanceReminderWATemplate(params: {
  employeeName: string;
  reminderType: "CHECK_IN" | "CHECK_OUT";
  scheduleTime: string;
}): string {
  const isCheckIn = params.reminderType === "CHECK_IN";
  const title = isCheckIn ? "⏰ Pengingat Absensi Masuk" : "🔔 Pengingat Absensi Keluar";
  const actionText = isCheckIn
    ? `Jangan lupa melakukan *Check-in Presensi* sebelum jam ${params.scheduleTime}.`
    : `Jam kerja telah selesai (${params.scheduleTime}). Pastikan melakukan *Check-out Presensi*.`;

  return (
    `*${title}*\n\n` +
    `Halo *${params.employeeName}*,\n` +
    `${actionText}\n\n` +
    `Lakukan absen online dengan geofence di aplikasi:\n` +
    `👉 http://localhost:3000/absensi\n\n` +
    `_SmartHRIS Automated Reminder_`
  );
}

/**
 * Template 3: Encrypted Payslip Download Link
 */
export function buildPayslipWATemplate(params: {
  employeeName: string;
  periodMonth: string;
  encryptedLink: string;
}): string {
  return (
    `💵 *Slip Gaji Digital SmartHRIS*\n\n` +
    `Halo *${params.employeeName}*,\n` +
    `Slip Gaji Anda untuk periode *${params.periodMonth}* telah terbit dan terenkripsi secara aman.\n\n` +
    `Unduh slip gaji PDF Anda melalui link di bawah ini:\n` +
    `🔒 ${params.encryptedLink}\n\n` +
    `_Harap jaga kerahasiaan dokumen slip gaji Anda._`
  );
}
