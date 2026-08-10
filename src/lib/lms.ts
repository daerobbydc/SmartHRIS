import { prisma } from "@/lib/prisma";

export interface EnrollmentResult {
  enrollmentId: string;
  courseTitle: string;
  progress: number;
  isCompleted: boolean;
  certificateCode?: string;
}

/**
 * Enroll employee into an LMS course
 */
export async function enrollCourse(employeeId: string, courseId: string) {
  const course = await prisma.lmsCourse.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Materi pelatihan tidak ditemukan");
  }

  return await prisma.lmsEnrollment.upsert({
    where: {
      employeeId_courseId: { employeeId, courseId },
    },
    create: {
      employeeId,
      courseId,
      progress: 0,
      isCompleted: false,
    },
    update: {},
    include: {
      course: true,
    },
  });
}

/**
 * Update module progress & generate internal certificate upon 100% completion
 */
export async function updateCourseProgress(
  employeeId: string,
  courseId: string,
  progressPercent: number
): Promise<EnrollmentResult> {
  const cappedProgress = Math.min(100, Math.max(0, progressPercent));
  const isCompleted = cappedProgress === 100;
  const certificateCode = isCompleted ? `CERT-HRIS-${Date.now().toString().slice(-6)}` : undefined;

  const updated = await prisma.lmsEnrollment.update({
    where: {
      employeeId_courseId: { employeeId, courseId },
    },
    data: {
      progress: cappedProgress,
      isCompleted,
      certificateCode: isCompleted ? certificateCode : undefined,
      completedAt: isCompleted ? new Date() : undefined,
    },
    include: {
      course: true,
    },
  });

  // If completed, update Employee's TrainingHistory as well
  if (isCompleted) {
    await prisma.trainingHistory.create({
      data: {
        employeeId,
        name: updated.course.title,
        provider: "Internal LMS SmartHRIS",
        startDate: new Date(),
        endDate: new Date(),
        duration: updated.course.totalHours * 60,
        certificate: certificateCode || "INTERNAL-CERT",
        status: "COMPLETED",
      },
    });
  }

  return {
    enrollmentId: updated.id,
    courseTitle: updated.course.title,
    progress: updated.progress,
    isCompleted: updated.isCompleted,
    certificateCode: updated.certificateCode || undefined,
  };
}

/**
 * Get employee total completed training hours tracker
 */
export async function getEmployeeTrainingHours(employeeId: string): Promise<{ totalHours: number; totalCourses: number }> {
  const enrollments = await prisma.lmsEnrollment.findMany({
    where: { employeeId, isCompleted: true },
    include: { course: true },
  });

  const totalHours = enrollments.reduce((sum, enr) => sum + enr.course.totalHours, 0);
  return {
    totalHours,
    totalCourses: enrollments.length,
  };
}
