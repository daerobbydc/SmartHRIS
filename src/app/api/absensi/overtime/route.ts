import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const overtime = await prisma.overtime.findMany({
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json(overtime);
  } catch (error) {
    console.error("Overtime GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, startTime, endTime, hours, reason } = body;

    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        hours: parseFloat(hours),
        reason,
      },
    });

    return NextResponse.json(overtime, { status: 201 });
  } catch (error) {
    console.error("Overtime POST error:", error);
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
        { error: "Overtime ID is required" },
        { status: 400 }
      );
    }

    const overtime = await prisma.overtime.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(overtime);
  } catch (error) {
    console.error("Overtime PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
