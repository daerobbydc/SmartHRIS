import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  createShiftSwapRequest,
  respondByColleague,
  respondByManager,
} from "@/lib/shift-swap";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};

    if (employeeId) {
      where.OR = [{ requesterId: employeeId }, { recipientId: employeeId }];
    }

    const requests = await prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requester: { select: { firstName: true, lastName: true, department: true, position: true } },
        recipient: { select: { firstName: true, lastName: true, department: true, position: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Shift Swap GET Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengajuan tukar shift" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { requesterId, recipientId, requesterDate, recipientDate, reason } = body;

    if (!requesterId || !recipientId || !requesterDate || !recipientDate) {
      return NextResponse.json(
        { error: "Permintaan harus melengkapi data pemohon, penerima, dan tanggal shift" },
        { status: 400 }
      );
    }

    const result = await createShiftSwapRequest({
      requesterId,
      recipientId,
      requesterDate: new Date(requesterDate),
      recipientDate: new Date(recipientDate),
      reason,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Shift Swap POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal membuat pengajuan tukar shift" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { requestId, action, recipientId, accepted, approved, note } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "RequestId dan action harus ditentukan" }, { status: 400 });
    }

    if (action === "COLLEAGUE_RESPOND") {
      const result = await respondByColleague(requestId, recipientId, Boolean(accepted), note);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "MANAGER_RESPOND") {
      const result = await respondByManager(requestId, auth.userId, Boolean(approved), note);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("Shift Swap PUT Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memperbarui status tukar shift" }, { status: 500 });
  }
}
