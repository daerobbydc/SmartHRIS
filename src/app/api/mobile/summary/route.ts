import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/summary?employeeId=EMP-003
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

    // 1. Leave balance calculation from database
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId },
    });
    const totalRemainingLeave = balances.reduce(
      (acc, curr) => acc + (curr.total - curr.used),
      0
    );

    // 2. Attendance count this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyAttendanceCount = await prisma.attendance.count({
      where: {
        employeeId,
        checkIn: { gte: startOfMonth },
      },
    });

    // 3. Next Payday (25th of current or next month)
    const payday = new Date(now.getFullYear(), now.getMonth(), 25);
    if (now.getDate() > 25) {
      payday.setMonth(payday.getMonth() + 1);
    }
    const paydayStr = payday.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
    });

    return NextResponse.json(
      {
        sisaCuti: totalRemainingLeave > 0 ? `${totalRemainingLeave} Hari` : "0 Hari",
        jadwalShift: "WFO · Shift Normal",
        gajiBerikutnya: paydayStr,
        kehadiranBulanIni: `${monthlyAttendanceCount} Hari`,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Mobile summary GET error:", error);
    return NextResponse.json(
      {
        sisaCuti: "0 Hari",
        jadwalShift: "WFO",
        gajiBerikutnya: "25",
        kehadiranBulanIni: "0 Hari",
      },
      { status: 500 }
    );
  }
}
