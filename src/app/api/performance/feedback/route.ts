import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const period = searchParams.get("period");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (period) where.period = period;
    if (year) where.year = parseInt(year);

    const feedbacks = await prisma.feedback360.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedback = await prisma.feedback360.create({
      data: {
        employeeId: body.employeeId,
        assessorId: body.assessorId,
        assessorName: body.assessorName,
        assessorRole: body.assessorRole,
        category: body.category,
        score: parseFloat(body.score),
        comments: body.comments,
        period: body.period,
        year: parseInt(body.year),
        isAnonymous: body.isAnonymous || false,
      },
    });
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
