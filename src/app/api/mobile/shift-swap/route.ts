import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/shift-swap?employeeId=EMP-003
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

    const swaps = await prisma.shiftSwapRequest.findMany({
      where: {
        OR: [
          { requesterId: employeeId },
          { recipientId: employeeId },
        ],
      },
      include: {
        requester: { select: { firstName: true, lastName: true, employeeId: true } },
        recipient: { select: { firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(swaps, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile shift-swap GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tukar shift" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/shift-swap — Submit shift swap request
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const swap = await prisma.shiftSwapRequest.create({
      data: {
        requesterId: body.requesterId || "EMP-003",
        recipientId: body.recipientId || "EMP-001",
        requesterDate: new Date(body.date || Date.now()),
        recipientDate: new Date(body.date || Date.now()),
        reason: body.reason || "",
        status: "PENDING_COLLEAGUE",
      },
    });

    return NextResponse.json(swap, { status: 201 });
  } catch (error) {
    console.error("Mobile shift-swap POST error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pengajuan tukar shift" },
      { status: 500 }
    );
  }
}
