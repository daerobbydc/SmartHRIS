import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createBusinessTrip, approveBusinessTrip } from "@/lib/business-trip";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const trips = await prisma.businessTrip.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, position: true } },
        settlements: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips);
  } catch (error: any) {
    console.error("Business Trip GET Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data perjalanan dinas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { employeeId, title, destination, purpose, startDate, endDate, estimatedBudget, cashAdvanceAmount } = body;

    if (!employeeId || !title || !destination || !startDate || !endDate) {
      return NextResponse.json({ error: "Mohon lengkapi semua data wajib pengajuan perjalanan dinas" }, { status: 400 });
    }

    const trip = await createBusinessTrip({
      employeeId,
      title,
      destination,
      purpose,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      estimatedBudget: Number(estimatedBudget || 0),
      cashAdvanceAmount: Number(cashAdvanceAmount || 0),
    });

    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (error: any) {
    console.error("Business Trip POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal mengajukan perjalanan dinas" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { tripId, approved, rejectionReason } = body;

    if (!tripId) {
      return NextResponse.json({ error: "TripId harus ditentukan" }, { status: 400 });
    }

    const result = await approveBusinessTrip(tripId, auth.userId, Boolean(approved), rejectionReason);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Business Trip PUT Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal memperbarui status perjalanan dinas" }, { status: 500 });
  }
}
