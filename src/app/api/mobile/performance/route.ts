import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/performance?employeeId=EMP-003
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "EMP-003";

    // Fetch OKRs or Task Assessments for performance
    const okrs = await prisma.oKR.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const reviews = await prisma.taskAssessment.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(
      {
        employeeId,
        score: 88,
        grade: "B",
        category: "Baik",
        okrs,
        reviews,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Mobile performance GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data penilaian kinerja" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/performance — Submit self assessment from mobile
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const feedback = await prisma.feedback360.create({
      data: {
        employeeId: body.employeeId || "EMP-003",
        assessorId: body.employeeId || "EMP-003",
        assessorName: "Self Review",
        assessorRole: "Employee",
        category: "SELF_ASSESSMENT",
        score: body.rating || 5.0,
        comments: body.notes || body.selfReview || "",
        period: "Q3",
        year: new Date().getFullYear(),
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Mobile performance POST error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan penilaian diri" },
      { status: 500 }
    );
  }
}
