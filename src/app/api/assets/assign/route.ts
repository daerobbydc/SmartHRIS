import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST - Assign asset
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { assetId, employeeId, notes } = await req.json();

    // Check if asset is available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Aset tidak tersedia" }, { status: 400 });
    }

    // Deactivate previous assignment
    await prisma.assetAssignment.updateMany({
      where: { assetId, isActive: true },
      data: { isActive: false, returnedAt: new Date() },
    });

    // Create new assignment
    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId,
        notes,
      },
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "ASSIGNED" },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Assign asset error:", error);
    return NextResponse.json({ error: "Gagal menugaskan aset" }, { status: 500 });
  }
}
