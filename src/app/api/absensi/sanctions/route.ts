import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await checkAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const sanctions = await prisma.attendanceSanction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sanctions);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth(request, { requiredPermission: "attendance:write" });
  if (auth instanceof NextResponse) return auth;

  // Ordinary employees cannot add sanctions
  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Forbidden - Karyawan tidak memiliki wewenang untuk menambahkan sanksi presensi" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const sanction = await prisma.attendanceSanction.create({ data: body });
    return NextResponse.json(sanction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAuth(request, { requiredPermission: "attendance:write" });
  if (auth instanceof NextResponse) return auth;

  // Ordinary employees cannot delete sanctions
  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Forbidden - Karyawan tidak memiliki wewenang untuk menghapus sanksi presensi" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID sanksi wajib diisi" }, { status: 400 });
    }

    await prisma.attendanceSanction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
