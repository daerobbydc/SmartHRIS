import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OFFICE_LOCATIONS } from "@/lib/geofence";

export async function GET() {
  try {
    let locations = await prisma.officeLocation.findMany({
      orderBy: { name: "asc" },
    });

    if (locations.length === 0) {
      // Auto-seed default office locations if DB is empty
      await prisma.officeLocation.createMany({
        data: DEFAULT_OFFICE_LOCATIONS.map((loc) => ({
          name: loc.name,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          radiusMeters: loc.radiusMeters,
          isActive: loc.isActive,
        })),
      });

      locations = await prisma.officeLocation.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Office locations GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, latitude, longitude, radiusMeters } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Name, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const location = await prisma.officeLocation.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: radiusMeters ? parseFloat(radiusMeters) : 150,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Office location POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID Lokasi wajib diisi" }, { status: 400 });
    }

    const body = await request.json();
    const { name, address, latitude, longitude, radiusMeters, isActive } = body;

    const location = await prisma.officeLocation.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        address: address !== undefined ? address : undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        radiusMeters: radiusMeters !== undefined ? parseFloat(radiusMeters) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Office location PUT error:", error);
    return NextResponse.json({ error: "Gagal mengedit lokasi kantor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID Lokasi wajib diisi" }, { status: 400 });
    }

    await prisma.officeLocation.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Lokasi kantor berhasil dihapus" });
  } catch (error) {
    console.error("Office location DELETE error:", error);
    return NextResponse.json({ error: "Gagal menghapus lokasi kantor" }, { status: 500 });
  }
}
