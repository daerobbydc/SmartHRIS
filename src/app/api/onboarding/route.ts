import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getOnboardingChecklist,
  getOffboardingChecklist,
  initializeOnboarding,
  initializeOffboarding,
  completeChecklistItem,
  getOnboardingProgress,
} from "@/lib/onboarding";

// GET - Get checklist
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const type = searchParams.get("type") || "onboarding";

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  }

  try {
    if (type === "progress") {
      const progress = await getOnboardingProgress(employeeId);
      return NextResponse.json(progress);
    }

    if (type === "offboarding") {
      const checklist = await getOffboardingChecklist(employeeId);
      return NextResponse.json({ checklist });
    }

    const checklist = await getOnboardingChecklist(employeeId);
    return NextResponse.json({ checklist });
  } catch (error) {
    console.error("Checklist error:", error);
    return NextResponse.json({ error: "Gagal mengambil checklist" }, { status: 500 });
  }
}

// POST - Initialize checklist
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action, employeeId, type } = body;

    if (action === "initialize-onboarding") {
      const count = await initializeOnboarding(employeeId);
      return NextResponse.json({ success: true, count, message: `${count} tasks created` });
    }

    if (action === "initialize-offboarding") {
      const count = await initializeOffboarding(employeeId, type || "RESIGNATION");
      return NextResponse.json({ success: true, count, message: `${count} tasks created` });
    }

    if (action === "complete") {
      const { itemId, checklistType, notes } = body;
      await completeChecklistItem(itemId, checklistType || "onboarding", notes);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Checklist error:", error);
    return NextResponse.json({ error: "Gagal memproses" }, { status: 500 });
  }
}
