import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/leave?employeeId=EMP-003 — Fetch leave submissions for mobile
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(leaves, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile leave GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengajuan" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/leave — Submit leave request from mobile
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (!body.employeeId || !body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "employeeId, type, startDate, dan endDate wajib diisi" },
        { status: 400 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason || "",
        status: "PENDING",
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error("Mobile leave POST error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pengajuan" },
      { status: 500 }
    );
  }
}
