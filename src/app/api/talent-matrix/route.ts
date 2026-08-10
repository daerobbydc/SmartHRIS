import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { saveTalentMatrixRating, NINE_BOX_DICTIONARY } from "@/lib/talent-matrix";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const entries = await prisma.talentMatrix9Box.findMany({
      where: { year },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, department: true, position: true, photo: true } },
      },
    });

    return NextResponse.json({
      year,
      dictionary: NINE_BOX_DICTIONARY,
      entries,
    });
  } catch (error: any) {
    console.error("Talent Matrix GET Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data 9-Box Talent Matrix" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req, { requiredPermission: "performance:read" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { employeeId, performanceRating, potentialRating, year, notes } = body;

    if (!employeeId || performanceRating == null || potentialRating == null) {
      return NextResponse.json({ error: "Data karyawan, rating kinerja, dan potensi wajib diisi" }, { status: 400 });
    }

    const result = await saveTalentMatrixRating(
      employeeId,
      Number(performanceRating),
      Number(potentialRating),
      year ? Number(year) : new Date().getFullYear(),
      notes,
      auth.userId
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Talent Matrix POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal menyimpan rating 9-Box Matrix" }, { status: 500 });
  }
}
