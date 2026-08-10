import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const okrs = await prisma.oKR.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(okrs);
  } catch (error) {
    console.error("OKR GET error:", error);
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
      employeeId,
      title,
      description,
      type,
      parentId,
      targetValue,
      currentValue,
      unit,
      period,
      year,
      quarter,
    } = body;

    const okr = await prisma.oKR.create({
      data: {
        employeeId,
        title,
        description,
        type,
        parentId,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        unit,
        period,
        year: parseInt(year),
        quarter: quarter ? parseInt(quarter) : null,
      },
    });

    return NextResponse.json(okr, { status: 201 });
  } catch (error) {
    console.error("OKR POST error:", error);
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
        { error: "OKR ID is required" },
        { status: 400 }
      );
    }

    if (body.targetValue !== undefined) {
      body.targetValue = parseFloat(body.targetValue);
    }
    if (body.currentValue !== undefined) {
      body.currentValue = parseFloat(body.currentValue);
    }

    const okr = await prisma.oKR.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(okr);
  } catch (error) {
    console.error("OKR PUT error:", error);
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
        { error: "OKR ID is required" },
        { status: 400 }
      );
    }

    await prisma.oKR.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OKR DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
