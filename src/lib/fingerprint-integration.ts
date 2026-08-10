import { prisma } from "@/lib/prisma";

export interface BiometricScanPayload {
  deviceCode: string;
  secretToken?: string;
  employeePin: string; // PIN / NIK / EmployeeID
  timestamp: string | Date;
  scanType?: "CHECK_IN" | "CHECK_OUT" | "AUTOMATIC";
  verifyMode?: "FINGERPRINT" | "FACE" | "CARD" | "PASSWORD";
  rawPayload?: string;
}

export interface BiometricScanResult {
  success: boolean;
  message: string;
  logId?: string;
  employeeName?: string;
  attendanceStatus?: string;
  actionTaken?: "CHECK_IN" | "CHECK_OUT";
}

/**
 * Process incoming realtime biometric scan from physical fingerprint/facial machines
 */
export async function processBiometricScan(
  payload: BiometricScanPayload
): Promise<BiometricScanResult> {
  const { deviceCode, secretToken, employeePin, timestamp, scanType, verifyMode, rawPayload } = payload;

  // 1. Find or auto-register Biometric Device
  let device = await prisma.biometricDevice.findUnique({
    where: { deviceCode },
  });

  if (!device) {
    device = await prisma.biometricDevice.create({
      data: {
        deviceCode,
        name: `Mesin Fingerprint (${deviceCode})`,
        location: "Lokasi Default Kantor",
        status: "ONLINE",
        secretToken: secretToken || `sec_${Date.now()}`,
        lastSyncAt: new Date(),
      },
    });
  } else {
    // Update last sync time
    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: { lastSyncAt: new Date(), status: "ONLINE" },
    });
  }

  // 2. Find Employee matching employeePin (matches employeeId, nik, or userId)
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeId: employeePin },
        { nik: employeePin },
        { id: employeePin },
        { userId: employeePin },
      ],
    },
  });

  const scanTime = new Date(timestamp);
  const targetDate = new Date(scanTime);
  targetDate.setHours(0, 0, 0, 0);

  // 3. Create BiometricLog record
  const log = await prisma.biometricLog.create({
    data: {
      deviceId: device.id,
      employeePin,
      employeeId: employee?.id || null,
      timestamp: scanTime,
      scanType: scanType || "AUTOMATIC",
      verifyMode: verifyMode || "FINGERPRINT",
      rawPayload: rawPayload || JSON.stringify(payload),
      isProcessed: true,
    },
  });

  if (!employee) {
    return {
      success: false,
      message: `Log tersimpan (ID: ${log.id}), tetapi PIN ${employeePin} tidak cocok dengan data karyawan SmartHRIS`,
      logId: log.id,
    };
  }

  // 4. Sync into Attendance Table
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: employee.id,
        date: targetDate,
      },
    },
  });

  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const locationLabel = `Mesin Fingerprint ${device.name} (${device.deviceCode})`;

  let actionTaken: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN";

  if (scanType === "CHECK_OUT" || (existingAttendance && existingAttendance.checkIn && !existingAttendance.checkOut)) {
    actionTaken = "CHECK_OUT";

    const updated = await prisma.attendance.update({
      where: { id: existingAttendance!.id },
      data: {
        checkOut: scanTime,
        checkOutLocation: locationLabel,
        notes: existingAttendance!.notes
          ? `${existingAttendance!.notes}\n[Fingerprint Out]: ${scanTime.toLocaleTimeString("id-ID")}`
          : `[Fingerprint Out]: ${scanTime.toLocaleTimeString("id-ID")}`,
      },
    });

    return {
      success: true,
      message: `Presensi Keluar tercatat untuk ${employeeName} via ${device.name}`,
      logId: log.id,
      employeeName,
      attendanceStatus: updated.status,
      actionTaken,
    };
  } else {
    // Check-In Logic
    const currentHour = scanTime.getHours();
    const currentMinute = scanTime.getMinutes();
    const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 30);
    const status = isLate ? "LATE" : "PRESENT";

    const upserted = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: targetDate,
        },
      },
      update: {
        checkIn: scanTime,
        status,
        checkInLocation: locationLabel,
        notes: `[Fingerprint In]: ${scanTime.toLocaleTimeString("id-ID")}`,
      },
      create: {
        employeeId: employee.id,
        date: targetDate,
        checkIn: scanTime,
        status,
        checkInLocation: locationLabel,
        notes: `[Fingerprint In]: ${scanTime.toLocaleTimeString("id-ID")}`,
      },
    });

    return {
      success: true,
      message: `Presensi Masuk (${status === "LATE" ? "Terlambat" : "Tepat Waktu"}) tercatat untuk ${employeeName} via ${device.name}`,
      logId: log.id,
      employeeName,
      attendanceStatus: upserted.status,
      actionTaken,
    };
  }
}

/**
 * Parses native ZKTeco/Solution ADMS tab-separated push payload format
 * Sample line: "123\t2026-08-11 08:02:15\t0\t1"
 */
export function parseADMSBody(bodyText: string): Partial<BiometricScanPayload>[] {
  const lines = bodyText.split("\n").filter((l) => l.trim() !== "");
  const results: Partial<BiometricScanPayload>[] = [];

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const employeePin = parts[0].trim();
      const timeStr = parts[1].trim();
      const stateCode = parts[2]?.trim(); // 0 = checkin, 1 = checkout

      let scanType: BiometricScanPayload["scanType"] = "AUTOMATIC";
      if (stateCode === "0") scanType = "CHECK_IN";
      if (stateCode === "1") scanType = "CHECK_OUT";

      results.push({
        employeePin,
        timestamp: new Date(timeStr),
        scanType,
        verifyMode: "FINGERPRINT",
        rawPayload: line,
      });
    }
  }

  return results;
}
