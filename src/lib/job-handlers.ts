import { jobQueue } from "@/lib/queue";
import { sendEmail } from "@/lib/notifications";
import { sendWhatsAppMessage } from "@/lib/wa-bot";

/**
 * Initialize and register all background job handlers
 */
export function initJobHandlers() {
  // 1. Email Handler
  jobQueue.registerHandler("SEND_EMAIL", async (payload: { to: string; subject: string; body: string }) => {
    console.log(`[JobQueue] Processing Email dispatch to ${payload.to}...`);
    return await sendEmail({ to: payload.to, subject: payload.subject, html: payload.body });
  });

  // 2. WhatsApp Handler
  jobQueue.registerHandler("SEND_WHATSAPP", async (payload: { phone: string; message: string }) => {
    console.log(`[JobQueue] Processing WhatsApp dispatch to ${payload.phone}...`);
    return await sendWhatsAppMessage({ phone: payload.phone, message: payload.message });
  });

  // 3. Payroll PDF Generation Handler
  jobQueue.registerHandler("GENERATE_PAYROLL_PDF", async (payload: { payrollIds: string[] }) => {
    console.log(`[JobQueue] Batch generating payroll PDFs for ${payload.payrollIds.length} records...`);
    // Simulated background PDF batch render
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, processedCount: payload.payrollIds.length };
  });

  // 4. Bank Export File Generation Handler
  jobQueue.registerHandler("GENERATE_BANK_EXPORT", async (payload: { month: number; year: number; bankName: string }) => {
    console.log(`[JobQueue] Generating bank export file for ${payload.bankName} (${payload.month}/${payload.year})...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, fileName: `Payroll_${payload.bankName}_${payload.year}${payload.month}.csv` };
  });

  // 5. AI Matching Handler
  jobQueue.registerHandler("PROCESS_AI_MATCHING", async (payload: { applicantId: string; cvText: string }) => {
    console.log(`[JobQueue] Running AI Resume Analysis for Applicant ${payload.applicantId}...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true, applicantId: payload.applicantId, score: 88 };
  });

  console.log("✓ Background Job Handlers Registered Successfully");
}

// Auto register on server initialization
if (typeof window === "undefined") {
  initJobHandlers();
}
