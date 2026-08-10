import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const cv = await prisma.cV.findUnique({
      where: { employeeId },
    });

    return NextResponse.json(cv);
  } catch (error) {
    console.error("CV GET error:", error);
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
      summary,
      skills,
      experience,
      education,
      certifications,
      languages,
    } = body;

    const cv = await prisma.cV.upsert({
      where: { employeeId },
      update: {
        summary,
        skills,
        experience,
        education,
        certifications,
        languages,
      },
      create: {
        employeeId,
        summary,
        skills,
        experience,
        education,
        certifications,
        languages,
      },
    });

    return NextResponse.json(cv, { status: 201 });
  } catch (error) {
    console.error("CV POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
