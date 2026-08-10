import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth(req);
    const userId = auth instanceof NextResponse ? null : auth.userId;
    const userRole = auth instanceof NextResponse ? null : auth.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current employee record if logged in
    let currentEmployee: any = null;
    if (userId) {
      currentEmployee = await prisma.employee.findFirst({
        where: { userId },
      });
    }

    const [
      totalEmployees,
      presentToday,
      pendingLeaves,
      payrollSum,
      recentVacancies,
      recentApplicants,
      totalApplicantsCount,
      shortlistedCount,
      rejectedCount,
      interviews,
      announcements,
      employeeSubmissions,
      employeeAttendance,
      employeeLeaveBalance,
      employeeCompletedLms,
    ] = await Promise.all([
      prisma.employee.count({
        where: { status: "ACTIVE" },
      }),
      prisma.attendance.count({
        where: {
          date: today,
          status: { in: ["PRESENT", "LATE"] },
        },
      }),
      prisma.leave.count({
        where: { status: "PENDING" },
      }),
      prisma.payroll.aggregate({
        where: {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          status: "PAID",
        },
        _sum: { netSalary: true },
      }),
      prisma.jobVacancy.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { _count: { select: { applicants: true } } },
      }),
      prisma.applicant.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vacancy: { select: { title: true } } },
      }),
      prisma.applicant.count(),
      prisma.applicant.count({ where: { status: "HIRED" } }),
      prisma.applicant.count({ where: { status: "REJECTED" } }),
      prisma.interview.findMany({
        where: { status: "SCHEDULED" },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { applicant: { select: { name: true } } },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      currentEmployee
        ? prisma.submission.findMany({
            where: { employeeId: currentEmployee.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : [],
      currentEmployee
        ? prisma.attendance.findFirst({
            where: { employeeId: currentEmployee.id, date: today },
          })
        : null,
      currentEmployee
        ? prisma.leaveBalance.findFirst({
            where: { employeeId: currentEmployee.id, year: today.getFullYear(), leaveType: "ANNUAL" },
          })
        : null,
      currentEmployee
        ? prisma.lmsEnrollment.count({
            where: { employeeId: currentEmployee.id, progress: 100 },
          })
        : 0,
    ]);

    const monthlyData = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR("createdAt", 'Mon') as name,
        COUNT(*)::int as applications,
        COUNT(*) FILTER (WHERE status = 'HIRED')::int as shortlisted,
        COUNT(*) FILTER (WHERE status = 'REJECTED')::int as rejected
      FROM "Applicant"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'Mon'), EXTRACT(MONTH FROM "createdAt")
      ORDER BY EXTRACT(MONTH FROM "createdAt")
    `);

    return NextResponse.json({
      totalEmployees,
      presentToday,
      pendingLeaves,
      totalPayroll: Number(payrollSum._sum.netSalary) || 0,
      totalApplicants: totalApplicantsCount,
      shortlisted: shortlistedCount,
      rejected: rejectedCount,
      applicationsData: monthlyData,
      recentJobs: recentVacancies.map((v: any) => ({
        id: v.id,
        title: v.title,
        department: v.department,
        applicants: v._count.applicants,
        createdAt: v.createdAt.toISOString(),
      })),
      activityFeed: recentApplicants.map((a: any) => ({
        id: a.id,
        name: a.name,
        action: "melamar posisi",
        target: a.vacancy.title,
        createdAt: a.createdAt.toISOString(),
        status: a.status,
      })),
      meetings: interviews.map((i: any) => ({
        id: i.id,
        name: i.applicant.name,
        scheduledAt: i.scheduledAt.toISOString(),
        interviewer: i.interviewer,
        location: i.location,
      })),
      // Real Employee Personal Metrics
      employeeMetrics: {
        leaveBalanceRemaining: employeeLeaveBalance ? (employeeLeaveBalance.total - employeeLeaveBalance.used) : 12,
        attendanceStatus: employeeAttendance ? (employeeAttendance.status === "PRESENT" ? "Hadir Tepat Waktu" : employeeAttendance.status === "LATE" ? "Terlambat" : employeeAttendance.status) : "Belum Presensi",
        pendingSubmissionsCount: employeeSubmissions.filter((s: any) => s.status === "PENDING").length,
        completedLmsCount: employeeCompletedLms || 0,
      },
      announcements: announcements.map((ann: any) => ({
        id: ann.id,
        title: ann.title,
        content: ann.content,
        priority: ann.priority,
        createdAt: ann.createdAt.toISOString(),
      })),
      employeeSubmissions: employeeSubmissions.map((s: any) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
