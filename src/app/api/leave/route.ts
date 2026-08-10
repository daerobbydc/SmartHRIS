import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request, { requiredPermission: "leave:read" });
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: { employeeId: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leave = await prisma.leave.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    const leave = await prisma.leave.update({
      where: { id: id! },
      data: {
        status: body.status,
        approvedBy: body.approvedBy,
      },
    });
    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
