import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/overtime?employeeId=EMP-003
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

    const overtimes = await prisma.overtime.findMany({
      where: { employeeId },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json(overtimes, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile overtime GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/mobile/overtime — Submit overtime request from mobile
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
    const hoursNum = Number(body.durationHours) || 2;

    const startTime = new Date(dateObj);
    startTime.setHours(17, 0, 0, 0);

    const endTime = new Date(dateObj);
    endTime.setHours(17 + hoursNum, 0, 0, 0);

    const overtime = await prisma.overtime.create({
      data: {
        employeeId: body.employeeId || "EMP-003",
        date: dateObj,
        startTime,
        endTime,
        hours: hoursNum,
        reason: body.reason || "Pengajuan lembur mobile",
        status: "PENDING",
      },
    });

    return NextResponse.json(overtime, { status: 201 });
  } catch (error) {
    console.error("Mobile overtime POST error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pengajuan lembur" },
      { status: 500 }
    );
  }
}
