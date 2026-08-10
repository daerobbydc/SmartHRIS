import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { getAllCelebrations, getTodaysCelebrations } from "@/lib/celebrations";

// GET - Get celebrations
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  const days = parseInt(searchParams.get("days") || "30");

  try {
    if (type === "today") {
      const today = await getTodaysCelebrations();
      return NextResponse.json({ celebrations: today });
    }

    const celebrations = await getAllCelebrations(days);
    return NextResponse.json(celebrations);
  } catch (error) {
    console.error("Celebrations error:", error);
    return NextResponse.json({ error: "Gagal mengambil data celebrasi" }, { status: 500 });
  }
}
