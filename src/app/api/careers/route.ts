import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyInfo } from "@/lib/company-config";

// GET - Public list of open job vacancies & company info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const type = searchParams.get("type") || "";

    const where: any = {
      status: "OPEN",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requirements: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department && department !== "ALL") {
      where.department = department;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    const vacancies = await prisma.jobVacancy.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const company = await getCompanyInfo();

    return NextResponse.json({
      company,
      vacancies,
    });
  } catch (error) {
    console.error("Public careers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public career vacancies" },
      { status: 500 }
    );
  }
}
