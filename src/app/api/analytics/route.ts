import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { predictTurnover, detectAnomalies, getPredictiveAnalytics, analyzeSalaryEquity } from "@/lib/ai-analytics";
import { getSmartInsights as getAttendanceInsights } from "@/lib/smart-attendance";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const [turnoverPrediction, anomalies, predictiveAnalytics, salaryEquity, attendanceInsights] = await Promise.all([
      predictTurnover(),
      detectAnomalies(),
      getPredictiveAnalytics(),
      analyzeSalaryEquity(),
      getAttendanceInsights(),
    ]);

    return NextResponse.json({
      turnoverPrediction,
      anomalies,
      predictiveAnalytics,
      salaryEquity,
      attendanceInsights,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Gagal mengambil data analytics" }, { status: 500 });
  }
}
