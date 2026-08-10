import { prisma } from "@/lib/prisma";

// ==================== AUTOMATED WORKFLOWS ====================

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: "leave_request" | "overtime_request" | "attendance_anomaly" | "performance_due" | "probation_end";
  condition: string;
  action: "auto_approve" | "notify_manager" | "notify_hr" | "create_task" | "send_reminder";
  isActive: boolean;
}

export interface WorkflowResult {
  success: boolean;
  action: string;
  message: string;
  affectedIds: string[];
}

// Default workflow rules
export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "auto-approve-short-leave",
    name: "Auto-approve cuti < 3 hari untuk karyawan berkinerja baik",
    trigger: "leave_request",
    condition: "duration <= 3 && performance_score >= 4",
    action: "auto_approve",
    isActive: true,
  },
  {
    id: "notify-manager-late",
    name: "Notifikasi manager jika karyawan terlambat > 3x",
    trigger: "attendance_anomaly",
    condition: "late_count >= 3",
    action: "notify_manager",
    isActive: true,
  },
  {
    id: "remind-performance-review",
    name: "Reminder review performa 7 hari sebelum deadline",
    trigger: "performance_due",
    condition: "days_until_due <= 7",
    action: "send_reminder",
    isActive: true,
  },
  {
    id: "probation-end-alert",
    name: "Alert 30 hari sebelum masa probation berakhir",
    trigger: "probation_end",
    condition: "days_until_end <= 30",
    action: "notify_hr",
    isActive: true,
  },
];

/**
 * Process leave request workflow
 */
export async function processLeaveWorkflow(leaveId: string): Promise<WorkflowResult> {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: { employee: true },
  });

  if (!leave) {
    return { success: false, action: "none", message: "Leave not found", affectedIds: [] };
  }

  // Calculate duration
  const startDate = new Date(leave.startDate);
  const endDate = new Date(leave.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Check if auto-approve rule applies
  if (duration <= 3 && leave.status === "PENDING") {
    // Auto-approve short leave
    await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "APPROVED", approvedBy: "SYSTEM (Auto-approve)" },
    });

    return {
      success: true,
      action: "auto_approve",
      message: `Cuti ${leave.type} untuk ${leave.employee.firstName} ${leave.employee.lastName} (${duration} hari) telah disetujui otomatis`,
      affectedIds: [leaveId],
    };
  }

  // Notify manager for long leave
  if (duration > 7) {
    // In production, send email/notification to manager
    console.log(`[WORKFLOW] Notify manager: ${leave.employee.firstName} ${leave.employee.lastName} mengajukan cuti ${duration} hari`);
  }

  return {
    success: true,
    action: "notify_manager",
    message: `Manager telah dinotifikasi untuk cuti ${duration} hari`,
    affectedIds: [leaveId],
  };
}

/**
 * Process attendance anomaly workflow
 */
export async function processAttendanceAnomaly(): Promise<WorkflowResult[]> {
  const results: WorkflowResult[] = [];

  // Get employees with excessive late arrivals this month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: {
      attendance: {
        where: {
          date: { gte: startOfMonth },
          status: "LATE",
        },
      },
    },
  });

  for (const emp of employees) {
    if (emp.attendance.length >= 3) {
      // Notify manager
      results.push({
        success: true,
        action: "notify_manager",
        message: `${emp.firstName} ${emp.lastName} terlambat ${emp.attendance.length} kali bulan ini`,
        affectedIds: [emp.id],
      });

      // Auto-create warning if late > 5 times
      if (emp.attendance.length >= 5) {
        await prisma.attendanceSanction.create({
          data: {
            employeeId: emp.id,
            type: "WARNING",
            description: `Terlambat ${emp.attendance.length} kali dalam bulan ${today.toLocaleDateString("id-ID", { month: "long" })}`,
            startDate: today,
            createdBy: "SYSTEM (Auto-warning)",
          },
        });

        results.push({
          success: true,
          action: "create_task",
          message: `Surat peringatan otomatis dibuat untuk ${emp.firstName} ${emp.lastName}`,
          affectedIds: [emp.id],
        });
      }
    }
  }

  return results;
}

/**
 * Process performance review reminders
 */
export async function processPerformanceReminders(): Promise<WorkflowResult[]> {
  const results: WorkflowResult[] = [];
  const today = new Date();

  // Check for pending performance reviews
  const pendingReviews = await prisma.taskAssessment.findMany({
    where: { status: "PENDING" },
    include: { employee: true },
  });

  for (const review of pendingReviews) {
    // Check if overdue
    const createdDate = new Date(review.createdAt);
    const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreated > 7) {
      results.push({
        success: true,
        action: "send_reminder",
        message: `Reminder: Review performa "${review.title}" untuk ${review.employee.firstName} ${review.employee.lastName} sudah ${daysSinceCreated} hari`,
        affectedIds: [review.id],
      });
    }
  }

  return results;
}

/**
 * Process probation end alerts
 */
export async function processProbationAlerts(): Promise<WorkflowResult[]> {
  const results: WorkflowResult[] = [];
  const today = new Date();

  // Employees hired in the last 90 days (probation period)
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentHires = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      hireDate: {
        gte: threeMonthsAgo,
        lte: today,
      },
    },
  });

  for (const emp of recentHires) {
    const hireDate = new Date(emp.hireDate);
    const probationEndDate = new Date(hireDate);
    probationEndDate.setMonth(probationEndDate.getMonth() + 3);

    const daysUntilEnd = Math.ceil(
      (probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilEnd <= 30 && daysUntilEnd > 0) {
      results.push({
        success: true,
        action: "notify_hr",
        message: `Masa probation ${emp.firstName} ${emp.lastName} berakhir dalam ${daysUntilEnd} hari`,
        affectedIds: [emp.id],
      });
    }
  }

  return results;
}

/**
 * Run all active workflows
 */
export async function runAllWorkflows(): Promise<{
  leaveResults: WorkflowResult[];
  attendanceResults: WorkflowResult[];
  performanceResults: WorkflowResult[];
  probationResults: WorkflowResult[];
}> {
  const [leaveResults, attendanceResults, performanceResults, probationResults] = await Promise.all([
    processAttendanceAnomaly(),
    processAttendanceAnomaly(),
    processPerformanceReminders(),
    processProbationAlerts(),
  ]);

  return {
    leaveResults,
    attendanceResults,
    performanceResults,
    probationResults,
  };
}
