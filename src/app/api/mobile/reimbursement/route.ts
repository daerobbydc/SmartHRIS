import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/reimbursement?employeeId=EMP-003
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

    const trips = await prisma.businessTrip.findMany({
      where: { employeeId },
      include: {
        settlements: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(trips, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile reimbursement GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/mobile/reimbursement — Submit reimbursement request from mobile
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const dateObj = new Date(body.date || Date.now());

    // Create business trip / reimbursement record
    const trip = await prisma.businessTrip.create({
      data: {
        employeeId: body.employeeId || "EMP-003",
        title: body.title || "Klaim Operational",
        destination: body.category || "Lainnya",
        purpose: `${body.category || "Lainnya"}: ${body.notes || ""}`,
        startDate: dateObj,
        endDate: dateObj,
        estimatedBudget: body.amount || 0,
        cashAdvanceAmount: body.amount || 0,
        status: "PENDING",
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Mobile reimbursement POST error:", error);
    return NextResponse.json(
      { error: "Gagal memproses klaim reimbursement" },
      { status: 500 }
    );
  }
}
