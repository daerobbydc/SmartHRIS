import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    let courses = await prisma.lmsCourse.findMany({
      where: { isPublished: true },
      include: {
        modules: { orderBy: { order: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed sample courses if empty
    if (courses.length === 0) {
      await prisma.lmsCourse.create({
        data: {
          title: "SOP & Orientasi Etika Kerja Perusahaan",
          description: "Panduan dasar nilai budaya kerja, kode etik, tata tertib kantor, serta panduan keselamatan kerja bagi seluruh karyawan baru.",
          category: "Onboarding & HR",
          level: "BEGINNER",
          totalHours: 2,
          modules: {
            create: [
              { title: "Pengenalan Budaya & Visi Misi Perusahaan", contentType: "VIDEO", durationMin: 20, order: 1 },
              { title: "Kode Etik, Kerahasiaan Data & Tata Tertib", contentType: "DOCUMENT", durationMin: 25, order: 2 },
              { title: "Kuis Orientasi Karyawan Baru", contentType: "QUIZ", durationMin: 15, order: 3 },
            ],
          },
        },
      });

      await prisma.lmsCourse.create({
        data: {
          title: "Cyber Security & Keamanan Informasi Karyawan",
          description: "Pelatihan pencegahan serangan Phishing, pengelolaan kata sandi aman, serta proteksi data rahasia perusahaan.",
          category: "IT & Security",
          level: "INTERMEDIATE",
          totalHours: 3,
          modules: {
            create: [
              { title: "Mengenali Serangan Social Engineering & Phishing", contentType: "VIDEO", durationMin: 30, order: 1 },
              { title: "Prosedur Pengamanan Perangkat & VPN Kantor", contentType: "DOCUMENT", durationMin: 25, order: 2 },
            ],
          },
        },
      });

      await prisma.lmsCourse.create({
        data: {
          title: "Dasar Kepemimpinan & Manajemen Tim (Leadership 101)",
          description: "Pengembangan kapabilitas manajerial, metode pemberian 360 feedback, penyusunan OKR tim, dan penanganan konflik kerja.",
          category: "Leadership & Management",
          level: "ADVANCED",
          totalHours: 4,
          modules: {
            create: [
              { title: "Peran Supervisor Sebagai Facilitator Tim", contentType: "VIDEO", durationMin: 40, order: 1 },
              { title: "Manajemen Target Berbasis OKR", contentType: "DOCUMENT", durationMin: 35, order: 2 },
            ],
          },
        },
      });

      await prisma.lmsCourse.create({
        data: {
          title: "Panduan Penggunaan Portal Self-Service SmartHRIS",
          description: "Tutorial langkah demi langkah melakukan pengajuan cuti, absensi geofencing, klaim reimbursement, dan unduh slip gaji.",
          category: "Employee Guidance",
          level: "BEGINNER",
          totalHours: 1,
          modules: {
            create: [
              { title: "Cara Absen Online & Mengatasi Kendala GPS", contentType: "VIDEO", durationMin: 15, order: 1 },
              { title: "Panduan Pengajuan Cuti & Lembur via Portal ESS", contentType: "DOCUMENT", durationMin: 15, order: 2 },
            ],
          },
        },
      });

      courses = await prisma.lmsCourse.findMany({
        where: { isPublished: true },
        include: {
          modules: { orderBy: { order: "asc" } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("LMS Courses GET Error:", error);
    return NextResponse.json({ error: "Gagal mengambil materi pelatihan LMS" }, { status: 500 });
  }
}

// POST - Create LMS course (HR/Admin only)
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat membuat materi pelatihan" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, category, level, totalHours } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Judul, deskripsi, dan kategori wajib diisi" }, { status: 400 });
    }

    const course = await prisma.lmsCourse.create({
      data: {
        title,
        description,
        category,
        level: level || "BEGINNER",
        totalHours: Number(totalHours || 1),
        modules: {
          create: body.moduleTitle
            ? [
                {
                  title: body.moduleTitle,
                  contentType: body.contentType || "VIDEO",
                  durationMin: Number(body.durationMin || 15),
                  contentUrl: body.contentUrl || null,
                  bodyText: body.bodyText || null,
                },
              ]
            : undefined,
        },
      },
    });

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error: any) {
    console.error("LMS Course POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal membuat materi pelatihan" }, { status: 500 });
  }
}

// PUT - Update LMS course (HR/Admin only)
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat mengubah materi pelatihan" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { courseId, title, description, category, level, totalHours, isPublished } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.lmsCourse.update({
      where: { id: courseId },
      data: {
        title,
        description,
        category,
        level,
        totalHours: totalHours ? Number(totalHours) : undefined,
        isPublished: isPublished != null ? Boolean(isPublished) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("LMS Course PUT Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memperbarui materi pelatihan" }, { status: 500 });
  }
}

// DELETE - Delete LMS course (HR/Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat menghapus materi pelatihan" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json({ error: "ID materi harus ditentukan" }, { status: 400 });
    }

    await prisma.lmsCourse.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true, message: "Materi pelatihan berhasil dihapus" });
  } catch (error: any) {
    console.error("LMS Course DELETE Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal menghapus materi pelatihan" }, { status: 500 });
  }
}

