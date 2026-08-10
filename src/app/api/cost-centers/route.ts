import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET - List cost centers
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  try {
    const costCenters = await prisma.costCenter.findMany({
      where: { year },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ costCenters });
  } catch (error) {
    console.error("Cost centers error:", error);
    return NextResponse.json({ error: "Gagal mengambil data cost center" }, { status: 500 });
  }
}

// POST - Create cost center
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const costCenter = await prisma.costCenter.create({
      data: {
        code: body.code,
        name: body.name,
        department: body.department,
        budget: body.budget,
        year: body.year || new Date().getFullYear(),
      },
    });
    return NextResponse.json(costCenter);
  } catch (error) {
    console.error("Create cost center error:", error);
    return NextResponse.json({ error: "Gagal membuat cost center" }, { status: 500 });
  }
}

// PUT - Update cost center
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    const costCenter = await prisma.costCenter.update({
      where: { id },
      data,
    });
    return NextResponse.json(costCenter);
  } catch (error) {
    console.error("Update cost center error:", error);
    return NextResponse.json({ error: "Gagal mengupdate cost center" }, { status: 500 });
  }
}
