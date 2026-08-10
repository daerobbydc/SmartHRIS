import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  sendWhatsAppMessage,
  buildApprovalWATemplate,
  buildAttendanceReminderWATemplate,
  buildPayslipWATemplate,
} from "@/lib/wa-bot";

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { actionType, phone, managerName, employeeName, requestType, details, reminderType, scheduleTime, periodMonth, encryptedLink } = body;

    if (!phone) {
      return NextResponse.json({ error: "Nomor WhatsApp penerima wajib diisi" }, { status: 400 });
    }

    let messageText = "";

    switch (actionType) {
      case "APPROVAL_ALERT":
        messageText = buildApprovalWATemplate({
          managerName: managerName || "Manager",
          employeeName: employeeName || "Karyawan",
          requestType: requestType || "Cuti",
          details: details || "Pengajuan izin cuti tahunan",
        });
        break;

      case "ATTENDANCE_REMINDER":
        messageText = buildAttendanceReminderWATemplate({
          employeeName: employeeName || "Karyawan",
          reminderType: reminderType || "CHECK_IN",
          scheduleTime: scheduleTime || "08:00",
        });
        break;

      case "PAYSLIP_LINK":
        messageText = buildPayslipWATemplate({
          employeeName: employeeName || "Karyawan",
          periodMonth: periodMonth || "Agustus 2026",
          encryptedLink: encryptedLink || "https://smarthris.com/payroll/download/encrypted-token",
        });
        break;

      default:
        messageText = body.customMessage || "Test WhatsApp notification from SmartHRIS Bot Gateway.";
        break;
    }

    const result = await sendWhatsAppMessage({
      phone,
      message: messageText,
      type: actionType,
    });

    return NextResponse.json({
      success: true,
      logId: result.logId,
      dispatchedMessage: messageText,
      gatewayResponse: result.response,
    });
  } catch (error: any) {
    console.error("WhatsApp API Dispatch Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal mengirim notifikasi WhatsApp" }, { status: 500 });
  }
}
