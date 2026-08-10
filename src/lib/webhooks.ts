// ==================== SLACK & TEAMS WEBHOOK INTEGRATION ====================

export interface WebhookMessage {
  title: string;
  message: string;
  color?: "good" | "warning" | "danger" | "info";
  fields?: { title: string; value: string; short?: boolean }[];
  footer?: string;
}

export interface WebhookConfig {
  slack?: string;
  teams?: string;
}

/**
 * Send notification to Slack webhook
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: WebhookMessage
): Promise<boolean> {
  try {
    const payload = {
      attachments: [
        {
          color: message.color === "good" ? "#10b981" : message.color === "warning" ? "#f59e0b" : message.color === "danger" ? "#ef4444" : "#0d9488",
          title: message.title,
          text: message.message,
          fields: message.fields?.map((f) => ({
            title: f.title,
            value: f.value,
            short: f.short ?? true,
          })),
          footer: message.footer || "SmartHRIS",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Slack webhook error:", error);
    return false;
  }
}

/**
 * Send notification to Microsoft Teams webhook
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  message: WebhookMessage
): Promise<boolean> {
  try {
    const colorMap: Record<string, string> = {
      good: "00FF00",
      warning: "FFAA00",
      danger: "FF0000",
      info: "0076D7",
    };

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: colorMap[message.color || "info"],
      summary: message.title,
      sections: [
        {
          activityTitle: message.title,
          activitySubtitle: message.footer || "SmartHRIS",
          activityImage: "https://smarthris.com/icon.png",
          text: message.message,
          facts: message.fields?.map((f) => ({
            name: f.title,
            value: f.value,
          })),
          markdown: true,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Teams webhook error:", error);
    return false;
  }
}

/**
 * Send notification to configured webhooks
 */
export async function sendNotification(
  config: WebhookConfig,
  message: WebhookMessage
): Promise<{ slack: boolean; teams: boolean }> {
  const results = { slack: false, teams: false };

  if (config.slack) {
    results.slack = await sendSlackNotification(config.slack, message);
  }

  if (config.teams) {
    results.teams = await sendTeamsNotification(config.teams, message);
  }

  return results;
}

// ==================== PREDEFINED NOTIFICATIONS ====================

/**
 * Send leave request notification
 */
export async function notifyLeaveRequest(
  config: WebhookConfig,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string
) {
  return sendNotification(config, {
    title: "📋 Pengajuan Cuti Baru",
    message: `${employeeName} mengajukan cuti ${leaveType}`,
    color: "info",
    fields: [
      { title: "Karyawan", value: employeeName, short: true },
      { title: "Tipe", value: leaveType, short: true },
      { title: "Tanggal", value: `${startDate} - ${endDate}`, short: false },
    ],
    footer: "SmartHRIS - Leave Management",
  });
}

/**
 * Send leave approval notification
 */
export async function notifyLeaveApproved(
  config: WebhookConfig,
  employeeName: string,
  approvedBy: string
) {
  return sendNotification(config, {
    title: "✅ Cuti Disetujui",
    message: `Pengajuan cuti ${employeeName} telah disetujui`,
    color: "good",
    fields: [
      { title: "Karyawan", value: employeeName, short: true },
      { title: "Disetujui oleh", value: approvedBy, short: true },
    ],
    footer: "SmartHRIS - Leave Management",
  });
}

/**
 * Send birthday notification
 */
export async function notifyBirthday(
  config: WebhookConfig,
  employeeName: string,
  birthday: string
) {
  return sendNotification(config, {
    title: "🎂 Selamat Ulang Tahun!",
    message: `Hari ini ${employeeName} berulang tahun`,
    color: "good",
    fields: [{ title: "Karyawan", value: employeeName }],
    footer: "SmartHRIS - Celebrations",
  });
}

/**
 * Send anniversary notification
 */
export async function notifyAnniversary(
  config: WebhookConfig,
  employeeName: string,
  years: number
) {
  return sendNotification(config, {
    title: "🎉 Selamat Work Anniversary!",
    message: `${employeeName} telah ${years} tahun bersama SmartHRIS`,
    color: "good",
    fields: [
      { title: "Karyawan", value: employeeName, short: true },
      { title: "Tahun ke-", value: `${years} tahun`, short: true },
    ],
    footer: "SmartHRIS - Celebrations",
  });
}

/**
 * Send payroll processed notification
 */
export async function notifyPayrollProcessed(
  config: WebhookConfig,
  month: number,
  year: number,
  totalEmployees: number,
  totalAmount: number
) {
  const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return sendNotification(config, {
    title: "💰 Payroll Diproses",
    message: `Gaji bulan ${monthName} telah selesai diproses`,
    color: "good",
    fields: [
      { title: "Periode", value: monthName, short: true },
      { title: "Jumlah Karyawan", value: `${totalEmployees} orang`, short: true },
      { title: "Total Gaji", value: `Rp ${totalAmount.toLocaleString("id-ID")}`, short: false },
    ],
    footer: "SmartHRIS - Payroll",
  });
}

/**
 * Send contract expiring notification
 */
export async function notifyContractExpiring(
  config: WebhookConfig,
  employeeName: string,
  endDate: string,
  daysRemaining: number
) {
  return sendNotification(config, {
    title: "⚠️ Kontrak Akan Berakhir",
    message: `Kontrak ${employeeName} akan berakhir dalam ${daysRemaining} hari`,
    color: "warning",
    fields: [
      { title: "Karyawan", value: employeeName, short: true },
      { title: "Sisa Hari", value: `${daysRemaining} hari`, short: true },
      { title: "Tanggal Berakhir", value: endDate, short: false },
    ],
    footer: "SmartHRIS - Contract Management",
  });
}
