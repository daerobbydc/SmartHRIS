import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/announcements";

// GET - Get notifications or unread count
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "unread-count") {
      const count = await getUnreadCount(auth.userId);
      return NextResponse.json({ count });
    }

    const limit = parseInt(searchParams.get("limit") || "20");
    const notifications = await getNotifications(auth.userId, limit);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 });
  }
}

// PUT - Mark as read
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");

  try {
    if (action === "read-all") {
      const count = await markAllAsRead(auth.userId);
      return NextResponse.json({ success: true, count });
    }

    if (id) {
      await markAsRead(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID required" }, { status: 400 });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

// DELETE - Delete notification
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await deleteNotification(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
