import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET - List assets
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { assetCode: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          assignments: {
            where: { isActive: true },
            include: { employee: { select: { firstName: true, lastName: true } } },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({ assets, total, page, limit });
  } catch (error) {
    console.error("Assets error:", error);
    return NextResponse.json({ error: "Gagal mengambil data aset" }, { status: 500 });
  }
}

// POST - Create asset
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const asset = await prisma.asset.create({
      data: {
        assetCode: body.assetCode,
        name: body.name,
        category: body.category,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice,
        currentValue: body.currentValue,
        location: body.location,
        notes: body.notes,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Create asset error:", error);
    return NextResponse.json({ error: "Gagal membuat aset" }, { status: 500 });
  }
}
