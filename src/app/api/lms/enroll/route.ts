import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { enrollCourse, updateCourseProgress } from "@/lib/lms";

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { employeeId, courseId, progressPercent } = body;

    if (!employeeId || !courseId) {
      return NextResponse.json({ error: "EmployeeId dan courseId wajib diisi" }, { status: 400 });
    }

    if (progressPercent != null) {
      const result = await updateCourseProgress(employeeId, courseId, Number(progressPercent));
      return NextResponse.json({ success: true, data: result });
    }

    const enrollment = await enrollCourse(employeeId, courseId);
    return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
  } catch (error: any) {
    console.error("LMS Enroll POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memproses pendaftaran pelatihan" }, { status: 500 });
  }
}
