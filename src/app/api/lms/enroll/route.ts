import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { enrollCourse, updateCourseProgress } from "@/lib/lms";

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { courseId, progressPercent } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId wajib diisi" }, { status: 400 });
    }

    // Find employee linked to logged-in user
    let employee = await prisma.employee.findFirst({
      where: { userId: auth.userId },
    });

    if (!employee) {
      employee = await prisma.employee.findFirst();
    }

    if (!employee) {
      return NextResponse.json({ error: "Data karyawan tidak ditemukan" }, { status: 400 });
    }

    const employeeId = employee.id;
    const progress = progressPercent != null ? Number(progressPercent) : 100;
    const isCompleted = progress >= 100;
    const certCode = isCompleted ? `CERT-HRIS-${Date.now().toString().slice(-6)}` : null;

    const enrollment = await prisma.lmsEnrollment.upsert({
      where: {
        employeeId_courseId: {
          employeeId,
          courseId,
        },
      },
      update: {
        progress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        certificateCode: certCode,
      },
      create: {
        employeeId,
        courseId,
        progress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        certificateCode: certCode,
      },
    });

    return NextResponse.json({ success: true, data: enrollment });
  } catch (error: any) {
    console.error("LMS Enroll POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memproses pendaftaran pelatihan" }, { status: 500 });
  }
}
