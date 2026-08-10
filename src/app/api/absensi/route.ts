import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGeofence } from "@/lib/geofence";
import {
  verifyLivenessAndAntiSpoofing,
  verifyMultiFactorLocation,
} from "@/lib/smart-attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const todayOnly = searchParams.get("todayOnly");

    const where: Record<string, unknown> = {};

    if (todayOnly === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = today;
    } else if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      where.date = targetDate;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const attendance = await prisma.attendance.findMany({
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
        officeLocation: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      action, // "check-in" or "check-out"
      latitude,
      longitude,
      officeLocationId,
      photo,
      notes,
      wifiBssid,
      wifiSsid,
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Karyawan ID wajib diisi" },
        { status: 400 }
      );
    }

    // Extract client IP address
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch office location if provided, or fallback to first active location
    let office = null;
    if (officeLocationId) {
      office = await prisma.officeLocation.findUnique({
        where: { id: officeLocationId },
      });
    }

    if (!office) {
      office = await prisma.officeLocation.findFirst({
        where: { isActive: true },
      });
    }

    // 1. Perform Multi-Factor Location Check (GPS + IP + Wi-Fi)
    let distanceMeters = 0;
    let isGeofenceValid = true;
    let isIpValid = true;
    let isWifiValid = true;
    let isMultiFactorPassed = true;

    if (office) {
      const multiFactor = verifyMultiFactorLocation({
        userLat: latitude,
        userLng: longitude,
        clientIp,
        wifiBssid,
        wifiSsid,
        office: {
          latitude: office.latitude,
          longitude: office.longitude,
          radiusMeters: office.radiusMeters,
          allowedIpAddresses: office.allowedIpAddresses,
          allowedBssids: office.allowedBssids,
          requireMultiFactor: office.requireMultiFactor,
        },
      });

      distanceMeters = multiFactor.distanceMeters;
      isGeofenceValid = multiFactor.isGeofenceValid;
      isIpValid = multiFactor.isIpValid;
      isWifiValid = multiFactor.isWifiValid;
      isMultiFactorPassed = multiFactor.isMultiFactorPassed;
    }

    // 2. Perform Facial Liveness & Anti-Spoofing Check
    const liveness = verifyLivenessAndAntiSpoofing(photo);

    if (!liveness.isLivenessPassed) {
      return NextResponse.json(
        {
          error: `Verifikasi Liveness Selfie gagal: ${liveness.livenessDetails}`,
          liveness,
        },
        { status: 400 }
      );
    }

    const locationName = office
      ? `${office.name} (${distanceMeters}m)`
      : "Lokasi Tidak Terdeteksi";

    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    const now = new Date();

    if (action === "check-out") {
      if (!existingAttendance || !existingAttendance.checkIn) {
        return NextResponse.json(
          { error: "Anda belum melakukan Absen Masuk hari ini" },
          { status: 400 }
        );
      }

      const updated = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOut: now,
          checkOutLocation: locationName,
          checkOutPhoto: photo || undefined,
          checkOutLat: latitude || null,
          checkOutLng: longitude || null,
          checkOutDistance: distanceMeters,
          isGeofenceValid: existingAttendance.isGeofenceValid && isGeofenceValid,
          clientIp,
          wifiBssid: wifiBssid || null,
          wifiSsid: wifiSsid || null,
          isIpValid,
          isWifiValid,
          livenessScore: liveness.livenessScore,
          isLivenessPassed: liveness.isLivenessPassed,
          livenessDetails: liveness.livenessDetails,
          notes: notes ? `${existingAttendance.notes || ""}\nOut: ${notes}` : existingAttendance.notes,
        },
        include: {
          employee: true,
          officeLocation: true,
        },
      });

      return NextResponse.json({
        message: "Berhasil Absen Keluar!",
        attendance: updated,
        geofenceValid: isGeofenceValid,
        isIpValid,
        isWifiValid,
        liveness,
        distanceMeters,
      });
    } else {
      // Default: Check-in
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 30);
      const status = isLate ? "LATE" : "PRESENT";

      const upserted = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: today,
          },
        },
        update: {
          checkIn: now,
          status,
          checkInLocation: locationName,
          checkInPhoto: photo || undefined,
          checkInLat: latitude || null,
          checkInLng: longitude || null,
          checkInDistance: distanceMeters,
          isGeofenceValid,
          clientIp,
          wifiBssid: wifiBssid || null,
          wifiSsid: wifiSsid || null,
          isIpValid,
          isWifiValid,
          livenessScore: liveness.livenessScore,
          isLivenessPassed: liveness.isLivenessPassed,
          livenessDetails: liveness.livenessDetails,
          officeLocationId: office?.id || null,
          notes: notes || undefined,
        },
        create: {
          employeeId,
          date: today,
          checkIn: now,
          status,
          checkInLocation: locationName,
          checkInPhoto: photo || undefined,
          checkInLat: latitude || null,
          checkInLng: longitude || null,
          checkInDistance: distanceMeters,
          isGeofenceValid,
          clientIp,
          wifiBssid: wifiBssid || null,
          wifiSsid: wifiSsid || null,
          isIpValid,
          isWifiValid,
          livenessScore: liveness.livenessScore,
          isLivenessPassed: liveness.isLivenessPassed,
          livenessDetails: liveness.livenessDetails,
          officeLocationId: office?.id || null,
          notes: notes || null,
        },
        include: {
          employee: true,
          officeLocation: true,
        },
      });

      return NextResponse.json({
        message: isLate ? "Absen Masuk Berhasil (Terlambat)" : "Absen Masuk Berhasil!",
        attendance: upserted,
        geofenceValid: isGeofenceValid,
        isIpValid,
        isWifiValid,
        liveness,
        distanceMeters,
      });
    }
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses absensi" },
      { status: 500 }
    );
  }
}

