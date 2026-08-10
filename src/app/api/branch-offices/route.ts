import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET - List branch offices
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const offices = await prisma.branchOffice.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ offices });
  } catch (error) {
    console.error("Branch offices error:", error);
    return NextResponse.json({ error: "Gagal mengambil data kantor cabang" }, { status: 500 });
  }
}

// POST - Create branch office
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const office = await prisma.branchOffice.create({
      data: {
        name: body.name,
        code: body.code,
        address: body.address,
        city: body.city,
        province: body.province,
        phone: body.phone,
        email: body.email,
        npwp: body.npwp,
      },
    });
    return NextResponse.json(office);
  } catch (error) {
    console.error("Create branch error:", error);
    return NextResponse.json({ error: "Gagal membuat kantor cabang" }, { status: 500 });
  }
}

// PUT - Update branch office
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    const office = await prisma.branchOffice.update({
      where: { id },
      data,
    });
    return NextResponse.json(office);
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json({ error: "Gagal mengupdate kantor cabang" }, { status: 500 });
  }
}
