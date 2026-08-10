import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  runAllWorkflows,
  processLeaveWorkflow,
  processAttendanceAnomaly,
} from "@/lib/workflows";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const results = await runAllWorkflows();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Workflow error:", error);
    return NextResponse.json({ error: "Gagal menjalankan workflow" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { action, leaveId } = body;

  try {
    let result;
    if (action === "process_leave" && leaveId) {
      result = await processLeaveWorkflow(leaveId);
    } else if (action === "process_attendance") {
      result = await processAttendanceAnomaly();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Workflow error:", error);
    return NextResponse.json({ error: "Gagal menjalankan workflow" }, { status: 500 });
  }
}
