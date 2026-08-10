import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/lms-courses — Public LMS courses for SmartHRIS Mobile App
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    let courses = await prisma.lmsCourse.findMany({
      where: { isPublished: true },
      include: {
        modules: { orderBy: { order: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed sample courses if database is empty
    if (courses.length === 0) {
      await prisma.lmsCourse.create({
        data: {
          title: "SOP & Orientasi Etika Kerja Perusahaan",
          description: "Panduan dasar nilai budaya kerja, kode etik, tata tertib kantor, serta panduan keselamatan kerja bagi seluruh karyawan.",
          category: "Onboarding & HR",
          level: "BEGINNER",
          totalHours: 2,
          isPublished: true,
          modules: {
            create: [
              {
                title: "Modul 1: Standar Operational Procedure & Kebijakan HR",
                contentType: "DOCUMENT",
                durationMin: 20,
                order: 1,
                bodyText: "Selamat datang di pelatihan SOP & Orientasi Etika Kerja. Modul ini membahas mengenai alur pengajuan izin, lembur, dan klaim reimbursement digital, kepatuhan jam kerja, serta standar keselamatan di lingkungan kantor.",
                contentUrl: "/documents/SOP_HR_2026.pdf",
              },
              {
                title: "Modul 2: Video Pelatihan Budaya Kerja & Etika Profesional",
                contentType: "VIDEO",
                durationMin: 30,
                order: 2,
                bodyText: "Video tutorial simulasi situasi kerja sehari-hari, pencegahan konflik internal, dan teknik komunikasi efektif dengan rekan tim.",
                contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              },
              {
                title: "Modul 3: Kuis Pemahaman & Evaluasi Orientasi",
                contentType: "QUIZ",
                durationMin: 15,
                order: 3,
                bodyText: "Tes pemahaman pilihan ganda mengenai standar operasional perusahaan untuk menguji tingkat kesiapan kerja.",
              },
            ],
          },
        },
      });

      await prisma.lmsCourse.create({
        data: {
          title: "Cyber Security & Keamanan Informasi Karyawan",
          description: "Pelatihan pencegahan serangan Phishing, pengamanan password perusahaan, serta proteksi data sensitif.",
          category: "IT & Security",
          level: "INTERMEDIATE",
          totalHours: 3,
          isPublished: true,
          modules: {
            create: [
              {
                title: "Modul 1: Panduan Proteksi Perangkat & VPN Kantor",
                contentType: "DOCUMENT",
                durationMin: 25,
                order: 1,
                bodyText: "Tata cara penggunaan VPN resmi SmartHRIS, verifikasi 2FA, dan manajemen proteksi email korporasi.",
                contentUrl: "/documents/CyberSecurity_Guide.pdf",
              },
              {
                title: "Modul 2: Video Simulasi Serangan Phishing & Social Engineering",
                contentType: "VIDEO",
                durationMin: 35,
                order: 2,
                bodyText: "Video demonstrasi cara mendeteksi email palsu, tautan mencurigakan, dan manipulasi psikologis dari pihak luar.",
                contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              },
              {
                title: "Modul 3: Evaluasi Risiko Keamanan Data",
                contentType: "QUIZ",
                durationMin: 15,
                order: 3,
                bodyText: "Ujian evaluasi kewaspadaan keamanan informasi digital.",
              },
            ],
          },
        },
      });

      // Re-fetch after seeding
      courses = await prisma.lmsCourse.findMany({
        where: { isPublished: true },
        include: {
          modules: { orderBy: { order: "asc" } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(courses, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile LMS courses error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kursus LMS" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/lms-courses — Save / Update progress from Mobile App
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { courseId, employeeEmail, progress } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    if (employeeEmail) {
      const emp = await prisma.employee.findFirst({
        where: { email: employeeEmail },
      });

      if (emp) {
        await prisma.lmsEnrollment.upsert({
          where: {
            employeeId_courseId: {
              employeeId: emp.id,
              courseId,
            },
          },
          update: {
            progress: Math.min(100, Number(progress || 0)),
            isCompleted: Number(progress) >= 100,
            completedAt: Number(progress) >= 100 ? new Date() : null,
          },
          create: {
            employeeId: emp.id,
            courseId,
            progress: Math.min(100, Number(progress || 0)),
            isCompleted: Number(progress) >= 100,
            completedAt: Number(progress) >= 100 ? new Date() : null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, courseId, progress });
  } catch (error) {
    console.error("Mobile LMS update error:", error);
    return NextResponse.json({ error: "Gagal memperbarui progres LMS" }, { status: 500 });
  }
}
