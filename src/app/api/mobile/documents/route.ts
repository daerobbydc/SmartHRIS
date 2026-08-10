import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/documents?employeeId=EMP-003
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

    const empDocs = await prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: "desc" },
    });

    const contracts = await prisma.contract.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        documents: empDocs,
        contracts,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Mobile documents GET error:", error);
    return NextResponse.json({ documents: [], contracts: [] }, { status: 500 });
  }
}
