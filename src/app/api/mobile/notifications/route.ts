import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/notifications?userId=EMP-003
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("employeeId") || "EMP-003";

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json(
      { notifications, unreadCount },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Mobile notifications GET error:", error);
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { status: 500 }
    );
  }
}

// PATCH /api/mobile/notifications — Mark notification as read
export async function PATCH(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { notificationId, userId, markAllRead } = body;

    if (markAllRead && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "Semua notifikasi dibaca" });
    }

    if (notificationId) {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "notificationId or markAllRead required" }, { status: 400 });
  } catch (error) {
    console.error("Mobile notifications PATCH error:", error);
    return NextResponse.json({ error: "Gagal meng-update notifikasi" }, { status: 500 });
  }
}

// POST /api/mobile/notifications — Send new notification to user
export async function POST(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "title dan message wajib diisi" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId || "EMP-003",
        title,
        message,
        type: type || "INFO",
        isRead: false,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Mobile notifications POST error:", error);
    return NextResponse.json({ error: "Gagal membuat notifikasi" }, { status: 500 });
  }
}
