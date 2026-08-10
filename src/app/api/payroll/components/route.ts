import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const components = await prisma.salaryComponent.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(components);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const component = await prisma.salaryComponent.create({
      data: {
        name: body.name,
        type: body.type,
        category: body.category,
        amount: body.amount ? parseFloat(body.amount) : null,
        percentage: body.percentage ? parseFloat(body.percentage) : null,
        isTaxable: body.isTaxable || false,
      },
    });
    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const component = await prisma.salaryComponent.update({
      where: { id: id! },
      data: body,
    });
    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await prisma.salaryComponent.delete({ where: { id: id! } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
