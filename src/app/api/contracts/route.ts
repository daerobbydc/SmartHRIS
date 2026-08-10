import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET - List contracts
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const expiring = searchParams.get("expiring") === "true";

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { employee: { firstName: { contains: search, mode: "insensitive" } } },
        { employee: { lastName: { contains: search, mode: "insensitive" } } },
        { position: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    // Filter contracts expiring within 30 days
    if (expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.endDate = { lte: thirtyDaysFromNow };
      where.status = "ACTIVE";
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, department: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { endDate: "asc" },
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({ contracts, total, page, limit });
  } catch (error) {
    console.error("Contracts error:", error);
    return NextResponse.json({ error: "Gagal mengambil data kontrak" }, { status: 500 });
  }
}

// POST - Create contract
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const contract = await prisma.contract.create({
      data: {
        employeeId: body.employeeId,
        contractType: body.contractType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        position: body.position,
        salary: body.salary,
        notes: body.notes,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Create contract error:", error);
    return NextResponse.json({ error: "Gagal membuat kontrak" }, { status: 500 });
  }
}
