import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST - Return asset
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { assetId, condition, notes } = await req.json();

    // Update assignment
    await prisma.assetAssignment.updateMany({
      where: { assetId, isActive: true },
      data: {
        isActive: false,
        returnedAt: new Date(),
        condition: condition || "Good",
        notes,
      },
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "AVAILABLE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Return asset error:", error);
    return NextResponse.json({ error: "Gagal mengembalikan aset" }, { status: 500 });
  }
}
