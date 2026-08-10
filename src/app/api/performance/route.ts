import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const period = searchParams.get("period");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (period) {
      where.period = period;
    }

    if (year) {
      where.year = parseInt(year);
    }

    const assessments = await prisma.taskAssessment.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Assessment GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create assessment (HR/Admin/Manager only)
export async function POST(request: NextRequest) {
  const auth = await checkAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat membuat penilaian" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      employeeId, title, description, weight, maxScore,
      period, year, month, assessedBy, notes,
    } = body;

    const assessment = await prisma.taskAssessment.create({
      data: {
        employeeId,
        title,
        description,
        weight: parseFloat(weight),
        maxScore: parseFloat(maxScore || 100),
        period,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        assessedBy,
        notes,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("Assessment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update/score assessment (HR/Admin/Manager only)
export async function PUT(request: NextRequest) {
  const auth = await checkAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat mengubah nilai penilaian" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 });
    }

    if (body.score !== undefined) body.score = parseFloat(body.score);
    if (body.weight !== undefined) body.weight = parseFloat(body.weight);

    const assessment = await prisma.taskAssessment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Assessment PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
