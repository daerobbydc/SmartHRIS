import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements";

// GET - Get announcements
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    if (id) {
      const announcement = await getAnnouncementById(id);
      return NextResponse.json(announcement);
    }

    const announcements = await getAnnouncements(limit);
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Announcements error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST - Create announcement (HR/Admin only)
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat membuat pengumuman" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const announcement = await createAnnouncement({
      ...body,
      authorId: auth.userId || "",
      authorName: "",
      publishAt: body.publishAt || new Date(),
    });
    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Gagal membuat pengumuman" }, { status: 500 });
  }
}

// PUT - Update announcement (HR/Admin only)
export async function PUT(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat mengubah pengumuman" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await updateAnnouncement(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update announcement error:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

// DELETE - Delete announcement (HR/Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat menghapus pengumuman" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await deleteAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
