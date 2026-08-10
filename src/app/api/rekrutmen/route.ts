import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const vacancies = await prisma.jobVacancy.findMany({
      where,
      include: {
        _count: {
          select: { applicants: true },
        },
        stages: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vacancies);
  } catch (error) {
    console.error("Vacancy GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      department,
      position,
      description,
      requirements,
      salary,
      type,
      location,
      deadline,
    } = body;

    const vacancy = await prisma.jobVacancy.create({
      data: {
        title,
        department,
        position,
        description,
        requirements,
        salary,
        type,
        location,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json(vacancy, { status: 201 });
  } catch (error) {
    console.error("Vacancy POST error:", error);
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
        { error: "Vacancy ID is required" },
        { status: 400 }
      );
    }

    const vacancy = await prisma.jobVacancy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(vacancy);
  } catch (error) {
    console.error("Vacancy PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Vacancy ID is required" },
        { status: 400 }
      );
    }

    await prisma.jobVacancy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vacancy DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
