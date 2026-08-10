import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { submitSettlement, approveSettlement } from "@/lib/business-trip";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const settlements = await prisma.cashAdvanceSettlement.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true } },
        businessTrip: { select: { title: true, destination: true, cashAdvanceAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(settlements);
  } catch (error: any) {
    console.error("Settlement GET Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data klaim settlement" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { businessTripId, employeeId, totalReceipts, advanceAmount, receiptUrls, notes } = body;

    if (!businessTripId || !employeeId || totalReceipts == null) {
      return NextResponse.json({ error: "Data klaim settlement tidak lengkap" }, { status: 400 });
    }

    const result = await submitSettlement({
      businessTripId,
      employeeId,
      totalReceipts: Number(totalReceipts),
      advanceAmount: Number(advanceAmount || 0),
      receiptUrls,
      notes,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Settlement POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal mengajukan settlement cash advance" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { settlementId, approved } = body;

    if (!settlementId) {
      return NextResponse.json({ error: "SettlementId harus ditentukan" }, { status: 400 });
    }

    const result = await approveSettlement(settlementId, auth.userId, Boolean(approved));
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Settlement PUT Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memperbarui status settlement" }, { status: 500 });
  }
}
