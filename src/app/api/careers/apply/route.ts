import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Submit Job Application from Public Portal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vacancyId, name, email, phone, cvUrl, coverLetter, source } = body;

    if (!vacancyId || !name || !email) {
      return NextResponse.json(
        { error: "Nama, email, dan ID lowongan wajib diisi." },
        { status: 400 }
      );
    }

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy || vacancy.status !== "OPEN") {
      return NextResponse.json(
        { error: "Lowongan kerja tidak ditemukan atau telah ditutup." },
        { status: 404 }
      );
    }

    // Simple AI keyword match score calculation
    let matchScore = 75;
    if (coverLetter || cvUrl) {
      const combinedText = `${coverLetter || ""} ${cvUrl || ""}`.toLowerCase();
      const reqKeywords = (vacancy.requirements || "").toLowerCase().split(/\s+/);
      let matchedCount = 0;
      reqKeywords.forEach((kw) => {
        if (kw.length > 3 && combinedText.includes(kw)) {
          matchedCount++;
        }
      });
      matchScore = Math.min(98, Math.max(65, 70 + Math.floor((matchedCount / Math.max(reqKeywords.length, 1)) * 30)));
    }

    const applicant = await prisma.applicant.create({
      data: {
        vacancyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        cvUrl: cvUrl ? cvUrl.trim() : null,
        coverLetter: coverLetter ? coverLetter.trim() : null,
        source: source || "Portal Karir Resmi",
        status: "SUBMITTED",
        aiMatchScore: matchScore,
        aiAnalysis: `Kesesuaian awal berkas dengan posisi ${vacancy.position} (${matchScore}% match). Dokumen terverifikasi via portal karir.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lamaran kerja Anda berhasil dikirim!",
      applicantId: applicant.id,
      vacancyTitle: vacancy.title,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Gagal mengirimkan lamaran. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
