import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/integrations/fingerprint/devices
export async function GET() {
  try {
    const devices = await prisma.biometricDevice.findMany({
      include: {
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Biometric devices GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar mesin fingerprint" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/fingerprint/devices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceCode, name, ipAddress, location } = body;

    if (!deviceCode || !name) {
      return NextResponse.json(
        { error: "Kode perangkat dan Nama mesin wajib diisi" },
        { status: 400 }
      );
    }

    const device = await prisma.biometricDevice.create({
      data: {
        deviceCode: deviceCode.trim().toUpperCase(),
        name,
        ipAddress: ipAddress || null,
        location: location || "Kantor Pusat",
        secretToken: `sec_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
        status: "ONLINE",
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("Biometric devices POST error:", error);
    return NextResponse.json(
      { error: "Gagal mendaftarkan mesin fingerprint (Kode Perangkat mungkin sudah ada)" },
      { status: 400 }
    );
  }
}

// DELETE /api/integrations/fingerprint/devices?id=xyz
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Device ID wajib diisi" },
        { status: 400 }
      );
    }

    await prisma.biometricDevice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Perangkat berhasil dihapus" });
  } catch (error) {
    console.error("Biometric devices DELETE error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus perangkat" },
      { status: 500 }
    );
  }
}
