import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const trainings = await prisma.trainingHistory.findMany({
      where,
      include: {
        employee: {
          select: { employeeId: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(trainings);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, name, provider, startDate, endDate, duration, certificate } = body;

    const training = await prisma.trainingHistory.create({
      data: {
        employeeId,
        name,
        provider,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        duration: duration ? parseInt(duration) : null,
        certificate,
      },
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.trainingHistory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
