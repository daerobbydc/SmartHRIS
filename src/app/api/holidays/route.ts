import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { getHolidays, addHoliday, addHolidays, deleteHoliday, getIndonesianHolidays } from "@/lib/holidays";

// GET - Get holidays
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const action = searchParams.get("action") || "list";

  try {
    if (action === "indo-holidays") {
      const holidays = getIndonesianHolidays(year);
      return NextResponse.json({ holidays, year });
    }

    const holidays = await getHolidays(year);
    return NextResponse.json({ holidays, year });
  } catch (error) {
    console.error("Holidays error:", error);
    return NextResponse.json({ error: "Gagal mengambil data holiday" }, { status: 500 });
  }
}

// POST - Add holiday or bulk import (HR/Admin only)
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat menambah hari libur" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "bulk-import") {
      const { holidays } = body;
      const count = await addHolidays(holidays);
      return NextResponse.json({ success: true, count, message: `${count} holidays imported` });
    }

    const holiday = await addHoliday(body.name, new Date(body.date), body.type);
    return NextResponse.json(holiday);
  } catch (error) {
    console.error("Add holiday error:", error);
    return NextResponse.json({ error: "Gagal menambah holiday" }, { status: 500 });
  }
}

// DELETE - Delete holiday (HR/Admin only)
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Akses ditolak: Karyawan tidak dapat menghapus hari libur" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return NextResponse.json({ error: "Gagal menghapus holiday" }, { status: 500 });
  }
}
