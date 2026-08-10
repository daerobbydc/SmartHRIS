import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAttendanceCorrection } from "@/lib/smart-attendance";

// GET /api/absensi/corrections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      type: "ATTENDANCE_CORRECTION",
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    const corrections = await prisma.submission.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(corrections);
  } catch (error) {
    console.error("Attendance corrections GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar koreksi absensi" },
      { status: 500 }
    );
  }
}

// POST /api/absensi/corrections - Submit a claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      targetDate,
      requestedCheckIn,
      requestedCheckOut,
      correctionReason,
      attachment,
    } = body;

    if (!employeeId || !targetDate || !correctionReason) {
      return NextResponse.json(
        { error: "Karyawan ID, tanggal absensi, dan alasan koreksi wajib diisi" },
        { status: 400 }
      );
    }

    const dateObj = new Date(targetDate);
    dateObj.setHours(0, 0, 0, 0);

    const submission = await prisma.submission.create({
      data: {
        employeeId,
        type: "ATTENDANCE_CORRECTION",
        title: `Koreksi Absensi Tanggal ${dateObj.toLocaleDateString("id-ID")}`,
        description: correctionReason,
        startDate: dateObj,
        endDate: dateObj,
        requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : null,
        requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : null,
        correctionReason,
        attachment: attachment || null,
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(
      {
        message: "Pengajuan koreksi absensi berhasil dikirim untuk persetujuan atasan!",
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance corrections POST error:", error);
    return NextResponse.json(
      { error: "Gagal mengajukan koreksi absensi" },
      { status: 500 }
    );
  }
}

// PUT /api/absensi/corrections - Approve / Reject
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const { status, approvedBy, rejectionReason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID submission dan status wajib diisi" },
        { status: 400 }
      );
    }

    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!currentSubmission) {
      return NextResponse.json(
        { error: "Pengajuan koreksi absensi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (status === "APPROVED") {
      // Process correction into Attendance record
      await processAttendanceCorrection(id, approvedBy || "Manager");

      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: approvedBy || "Manager",
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Koreksi absensi telah disetujui dan data absensi telah diperbarui!",
        submission: updated,
      });
    } else if (status === "REJECTED") {
      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedBy: approvedBy || "Manager",
          approvedAt: new Date(),
          rejectionReason: rejectionReason || "Ditolak oleh atasan",
        },
      });

      return NextResponse.json({
        message: "Pengajuan koreksi absensi ditolak.",
        submission: updated,
      });
    } else {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Attendance corrections PUT error:", error);
    return NextResponse.json(
      { error: "Gagal memproses persetujuan koreksi absensi" },
      { status: 500 }
    );
  }
}
