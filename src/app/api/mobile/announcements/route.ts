import { NextRequest, NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/announcements";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/announcements — Public for SmartHRIS Mobile App
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const announcements = await getAnnouncements(20);
    return NextResponse.json(announcements, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile announcements error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengumuman" },
      { status: 500 }
    );
  }
}
