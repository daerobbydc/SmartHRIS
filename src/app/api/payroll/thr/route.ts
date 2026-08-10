import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const thr = await prisma.tHR.findMany({
      where: { year: parseInt(year) },
      include: {
        employee: {
          select: { employeeId: true, firstName: true, lastName: true, department: true, salary: true },
        },
      } as never,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(thr);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const thr = await prisma.tHR.create({
      data: {
        employeeId: body.employeeId,
        year: parseInt(body.year),
        amount: parseFloat(body.amount),
      },
    });
    return NextResponse.json(thr, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const thr = await prisma.tHR.update({
      where: { id: id! },
      data: body,
    });
    return NextResponse.json(thr);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
