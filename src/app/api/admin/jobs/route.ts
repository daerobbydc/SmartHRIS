import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { jobQueue, type JobType, type JobStatus } from "@/lib/queue";
import "@/lib/job-handlers"; // Ensure handlers are loaded

/**
 * GET /api/admin/jobs
 * Returns job queue statistics and job list
 */
export async function GET(request: NextRequest) {
  const authResult = await checkAuth(request, { requiredPermission: "settings:manage" });
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as JobStatus | undefined;

  const stats = jobQueue.getStats();
  const jobs = jobQueue.listJobs(status || undefined);

  return NextResponse.json({
    success: true,
    stats,
    jobs,
  });
}

/**
 * POST /api/admin/jobs
 * Enqueue a new background job or retry a failed job
 */
export async function POST(request: NextRequest) {
  const authResult = await checkAuth(request, { requiredPermission: "settings:manage" });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { action, id, type, payload } = body;

    // Retry a failed job
    if (action === "retry" && id) {
      const success = jobQueue.retryJob(id);
      if (!success) {
        return NextResponse.json({ error: "Job not found or not in FAILED status" }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `Job ${id} retried` });
    }

    // Enqueue a new job
    if (!type || !payload) {
      return NextResponse.json({ error: "Missing type or payload" }, { status: 400 });
    }

    const job = jobQueue.enqueue(type as JobType, payload);

    return NextResponse.json({
      success: true,
      message: "Job enqueued successfully",
      job,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process job request" }, { status: 500 });
  }
}
