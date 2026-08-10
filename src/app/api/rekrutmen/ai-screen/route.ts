import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { screenCandidate, batchScreenApplicants } from "@/lib/ai-resume-parser";

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req, { requiredPermission: "recruitment:read" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { applicantId, vacancyId } = body;

    if (applicantId) {
      const result = await screenCandidate(applicantId);
      return NextResponse.json({ success: true, result });
    }

    if (vacancyId) {
      const results = await batchScreenApplicants(vacancyId);
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json(
      { error: "Permintaan harus menyertakan applicantId atau vacancyId" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("AI Screening Error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal melakukan AI Screening" },
      { status: 500 }
    );
  }
}
