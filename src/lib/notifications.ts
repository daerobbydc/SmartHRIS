import nodemailer from "nodemailer";

// ==================== EMAIL NOTIFICATION SYSTEM ====================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "SmartHRIS <noreply@smarthris.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Email template wrapper
 */
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #374151; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        .btn { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .btn-approve { background: #10b981; }
        .btn-reject { background: #ef4444; }
        .info-box { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 SmartHRIS</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} SmartHRIS. All rights reserved.</p>
          <p>Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== LEAVE NOTIFICATIONS ====================

export async function sendLeaveSubmittedEmail(
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<boolean> {
  const content = `
    <h2>📋 Pengajuan Cuti</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Pengajuan cuti Anda telah berhasil dikirim dan menunggu persetujuan.</p>
    <div class="info-box">
      <p><strong>Tipe Cuti:</strong> ${leaveType}</p>
      <p><strong>Tanggal:</strong> ${startDate} - ${endDate}</p>
      <p><strong>Alasan:</strong> ${reason}</p>
    </div>
    <p>Anda akan menerima email notifikasi setelah pengajuan diproses oleh manager.</p>
  `;
  return sendEmail({ to: employeeEmail, subject: "Pengajuan Cuti - SmartHRIS", html: emailWrapper(content) });
}

export async function sendLeaveApprovedEmail(
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  approvedBy: string
): Promise<boolean> {
  const content = `
    <h2>✅ Cuti Disetujui</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Kabar baik! Pengajuan cuti Anda telah <strong>disetujui</strong>.</p>
    <div class="info-box">
      <p><strong>Tipe Cuti:</strong> ${leaveType}</p>
      <p><strong>Tanggal:</strong> ${startDate} - ${endDate}</p>
      <p><strong>Disetujui oleh:</strong> ${approvedBy}</p>
    </div>
    <p>Selamat menikmati waktu liburan Anda! 🎉</p>
  `;
  return sendEmail({ to: employeeEmail, subject: "Cuti Disetujui - SmartHRIS", html: emailWrapper(content) });
}

export async function sendLeaveRejectedEmail(
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  rejectedBy: string,
  reason: string
): Promise<boolean> {
  const content = `
    <h2>❌ Cuti Ditolak</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Mohon maaf, pengajuan cuti Anda telah <strong>ditolak</strong>.</p>
    <div class="warning-box">
      <p><strong>Tipe Cuti:</strong> ${leaveType}</p>
      <p><strong>Tanggal:</strong> ${startDate} - ${endDate}</p>
      <p><strong>Ditolak oleh:</strong> ${rejectedBy}</p>
      <p><strong>Alasan:</strong> ${reason}</p>
    </div>
    <p>Jika ada pertanyaan, silakan hubungi HR.</p>
  `;
  return sendEmail({ to: employeeEmail, subject: "Cuti Ditolak - SmartHRIS", html: emailWrapper(content) });
}

// ==================== PAYROLL NOTIFICATIONS ====================

export async function sendPayslipEmail(
  employeeEmail: string,
  employeeName: string,
  month: number,
  year: number,
  netSalary: number,
  payslipPdf?: Buffer
): Promise<boolean> {
  const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const content = `
    <h2>💰 Slip Gaji</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Slip gaji Anda untuk bulan <strong>${monthName}</strong> telah tersedia.</p>
    <div class="info-box">
      <p><strong>Periode:</strong> ${monthName}</p>
      <p><strong>Gaji Bersih:</strong> Rp ${netSalary.toLocaleString("id-ID")}</p>
    </div>
    <p>Slip gaji terlampir dalam email ini.</p>
  `;
  
  const attachments = payslipPdf ? [{
    filename: `payslip-${month}-${year}.pdf`,
    content: payslipPdf,
    contentType: "application/pdf",
  }] : undefined;

  return sendEmail({ 
    to: employeeEmail, 
    subject: `Slip Gaji ${monthName} - SmartHRIS`, 
    html: emailWrapper(content),
    attachments,
  });
}

// ==================== RECRUITMENT NOTIFICATIONS ====================

export async function sendInterviewScheduleEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  interviewDate: string,
  interviewTime: string,
  interviewer: string,
  location: string
): Promise<boolean> {
  const content = `
    <h2>📅 Jadwal Interview</h2>
    <p>Halo <strong>${applicantName}</strong>,</p>
    <p>Anda telah dijadwalkan untuk interview posisi <strong>${jobTitle}</strong>.</p>
    <div class="info-box">
      <p><strong>Posisi:</strong> ${jobTitle}</p>
      <p><strong>Tanggal:</strong> ${interviewDate}</p>
      <p><strong>Waktu:</strong> ${interviewTime}</p>
      <p><strong>Interviewer:</strong> ${interviewer}</p>
      <p><strong>Lokasi:</strong> ${location}</p>
    </div>
    <p>Mohon hadir tepat waktu. Semoga berhasil! 🤞</p>
  `;
  return sendEmail({ to: applicantEmail, subject: `Jadwal Interview - ${jobTitle} - SmartHRIS`, html: emailWrapper(content) });
}

export async function sendOfferEmail(
  applicantEmail: string,
  applicantName: string,
  jobTitle: string,
  startDate: string
): Promise<boolean> {
  const content = `
    <h2>🎉 Selamat! Anda Diterima</h2>
    <p>Halo <strong>${applicantName}</strong>,</p>
    <p>Kami dengan bangga menginformasikan bahwa Anda telah <strong>diterima</strong> untuk posisi <strong>${jobTitle}</strong>.</p>
    <div class="info-box">
      <p><strong>Posisi:</strong> ${jobTitle}</p>
      <p><strong>Tanggal Mulai:</strong> ${startDate}</p>
    </div>
    <p>Tim HR akan menghubungi Anda untuk proses onboarding lebih lanjut.</p>
    <p>Selamat datang di SmartHRIS! 🚀</p>
  `;
  return sendEmail({ to: applicantEmail, subject: `Offer Letter - ${jobTitle} - SmartHRIS`, html: emailWrapper(content) });
}

// ==================== WELCOME EMAIL ====================

export async function sendWelcomeEmail(
  employeeEmail: string,
  employeeName: string,
  position: string,
  department: string,
  temporaryPassword: string
): Promise<boolean> {
  const content = `
    <h2>👋 Selamat Datang di SmartHRIS!</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Selamat datang di keluarga besar SmartHRIS! Kami sangat senang memiliki Anda di tim kami.</p>
    <div class="info-box">
      <p><strong>Posisi:</strong> ${position}</p>
      <p><strong>Departemen:</strong> ${department}</p>
    </div>
    <p>Berikut adalah akun Anda untuk login ke sistem:</p>
    <div class="warning-box">
      <p><strong>Email:</strong> ${employeeEmail}</p>
      <p><strong>Password Sementara:</strong> ${temporaryPassword}</p>
    </div>
    <p>⚠️ <strong>Penting:</strong> Silakan ubah password Anda setelah login pertama kali untuk keamanan.</p>
    <p>Login di: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login">SmartHRIS Login</a></p>
  `;
  return sendEmail({ to: employeeEmail, subject: "Selamat Datang di SmartHRIS! 🎉", html: emailWrapper(content) });
}

// ==================== REMINDER NOTIFICATIONS ====================

export async function sendInterviewReminderEmail(
  interviewerEmail: string,
  interviewerName: string,
  applicantName: string,
  jobTitle: string,
  interviewDate: string,
  interviewTime: string
): Promise<boolean> {
  const content = `
    <h2>⏰ Reminder: Interview Hari Ini</h2>
    <p>Halo <strong>${interviewerName}</strong>,</p>
    <p>Anda memiliki jadwal interview hari ini:</p>
    <div class="warning-box">
      <p><strong>Kandidat:</strong> ${applicantName}</p>
      <p><strong>Posisi:</strong> ${jobTitle}</p>
      <p><strong>Waktu:</strong> ${interviewTime}</p>
    </div>
    <p>Mohon persiapkan diri dengan membaca CV kandidat terlebih dahulu.</p>
  `;
  return sendEmail({ to: interviewerEmail, subject: `Reminder Interview - ${applicantName} - SmartHRIS`, html: emailWrapper(content) });
}

export async function sendContractEndReminderEmail(
  employeeEmail: string,
  employeeName: string,
  contractEndDate: string,
  daysRemaining: number
): Promise<boolean> {
  const content = `
    <h2>📅 Reminder: Kontrak Akan Berakhir</h2>
    <p>Halo <strong>${employeeName}</strong>,</p>
    <p>Kontrak kerja Anda akan berakhir dalam <strong>${daysRemaining} hari</strong>.</p>
    <div class="warning-box">
      <p><strong>Tanggal Berakhir:</strong> ${contractEndDate}</p>
      <p><strong>Sisa Hari:</strong> ${daysRemaining} hari</p>
    </div>
    <p>Silakan hubungi HR untuk informasi lebih lanjut mengenai perpanjangan kontrak.</p>
  `;
  return sendEmail({ to: employeeEmail, subject: `Kontrak Akan Berakhir - SmartHRIS`, html: emailWrapper(content) });
}
