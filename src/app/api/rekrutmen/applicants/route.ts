import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vacancyId = searchParams.get("vacancyId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (vacancyId) {
      where.vacancyId = vacancyId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        vacancy: {
          select: { title: true, department: true },
        },
        interviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applicants);
  } catch (error) {
    console.error("Applicants GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vacancyId, name, email, phone, cvUrl, coverLetter, source } = body;

    const applicant = await prisma.applicant.create({
      data: {
        vacancyId,
        name,
        email,
        phone,
        cvUrl,
        coverLetter,
        source,
      },
    });

    return NextResponse.json(applicant, { status: 201 });
  } catch (error) {
    console.error("Applicants POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Applicant ID is required" },
        { status: 400 }
      );
    }

    const applicant = await prisma.applicant.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(applicant);
  } catch (error) {
    console.error("Applicants PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
