import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getBenefits,
  createBenefit,
  getEmployeeBenefits,
  enrollBenefit,
  terminateBenefit,
} from "@/lib/benefits";

// GET - Get benefits or employee benefits
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");

  try {
    if (employeeId) {
      const benefits = await getEmployeeBenefits(employeeId);
      return NextResponse.json(benefits);
    }

    const benefits = await getBenefits();
    return NextResponse.json(benefits);
  } catch (error) {
    console.error("Benefits error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST - Create benefit or enroll
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "enroll") {
      const result = await enrollBenefit(
        body.employeeId,
        body.benefitId,
        new Date(body.startDate),
        body.endDate ? new Date(body.endDate) : undefined
      );
      return NextResponse.json(result);
    }

    const benefit = await createBenefit(body);
    return NextResponse.json(benefit);
  } catch (error) {
    console.error("Benefit error:", error);
    return NextResponse.json({ error: "Gagal memproses" }, { status: 500 });
  }
}

// PUT - Terminate benefit
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    if (action === "terminate") {
      await terminateBenefit(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Benefit error:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}
