import { prisma } from "@/lib/prisma";

export interface BiometricScanPayload {
  deviceCode: string;
  secretToken?: string;
  employeePin: string; // PIN / NIK / EmployeeID / Card Number
  timestamp: string | Date;
  scanType?: "CHECK_IN" | "CHECK_OUT" | "AUTOMATIC";
  verifyMode?: "FINGERPRINT" | "FACE" | "CARD" | "PASSWORD";
  rawPayload?: string;
  ipAddress?: string;
}

export interface BiometricScanResult {
  success: boolean;
  message: string;
  logId?: string;
  employeeName?: string;
  attendanceStatus?: string;
  actionTaken?: "CHECK_IN" | "CHECK_OUT";
  deviceCode?: string;
}

/**
 * Process incoming realtime biometric scan from physical fingerprint/facial machines
 */
export async function processBiometricScan(
  payload: BiometricScanPayload
): Promise<BiometricScanResult> {
  const { deviceCode, secretToken, employeePin, timestamp, scanType, verifyMode, rawPayload, ipAddress } = payload;

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
        ipAddress: ipAddress || null,
        secretToken: secretToken || `sec_${Date.now()}`,
        lastSyncAt: new Date(),
      },
    });
  } else {
    // Update last sync time & IP address
    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: {
        lastSyncAt: new Date(),
        status: "ONLINE",
        ...(ipAddress ? { ipAddress } : {}),
      },
    });
  }

  // 2. Find Employee matching employeePin (matches employeeId, nik, id, or userId)
  const cleanPin = String(employeePin).trim();
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeId: cleanPin },
        { nik: cleanPin },
        { id: cleanPin },
        { userId: cleanPin },
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
      employeePin: cleanPin,
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
      message: `Log tersimpan (ID: ${log.id}), tetapi PIN "${cleanPin}" tidak cocok dengan karyawan di SmartHRIS`,
      logId: log.id,
      deviceCode: device.deviceCode,
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
      deviceCode: device.deviceCode,
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
      deviceCode: device.deviceCode,
    };
  }
}

/**
 * Parses native ZKTeco/Solution ADMS tab-separated push payload format
 * Standard ADMS Line formats:
 * 1) "1001\t2026-08-11 08:02:15\t0\t1"
 * 2) "1001 2026-08-11 08:02:15 0 1"
 */
export function parseADMSBody(bodyText: string): Partial<BiometricScanPayload>[] {
  const lines = bodyText.split(/\r?\n/).filter((l) => l.trim() !== "");
  const results: Partial<BiometricScanPayload>[] = [];

  for (const line of lines) {
    if (line.includes("\t")) {
      const parts = line.split("\t");
      if (parts.length >= 2) {
        const employeePin = parts[0].trim();
        const timeStr = parts[1].trim();
        const stateCode = parts[2]?.trim(); // 0 = checkin, 1 = checkout, 4 = overtime in, etc.

        let scanType: BiometricScanPayload["scanType"] = "AUTOMATIC";
        if (stateCode === "0") scanType = "CHECK_IN";
        if (stateCode === "1") scanType = "CHECK_OUT";

        let verifyMode: BiometricScanPayload["verifyMode"] = "FINGERPRINT";
        const modeCode = parts[3]?.trim();
        if (modeCode === "1" || modeCode === "15") verifyMode = "FINGERPRINT";
        if (modeCode === "15" || modeCode === "20") verifyMode = "FACE";
        if (modeCode === "2" || modeCode === "Card") verifyMode = "CARD";

        const scanDate = new Date(timeStr);
        if (!isNaN(scanDate.getTime())) {
          results.push({
            employeePin,
            timestamp: scanDate,
            scanType,
            verifyMode,
            rawPayload: line,
          });
        }
      }
    } else if (line.includes("pin=") || line.includes("user_id=")) {
      // URL encoded line format: pin=1001&time=2026-08-11 08:00:00&status=0
      const params = new URLSearchParams(line);
      const pin = params.get("pin") || params.get("user_id") || params.get("employeePin");
      const timeStr = params.get("time") || params.get("timestamp");
      const state = params.get("status") || params.get("state");

      if (pin) {
        let scanType: BiometricScanPayload["scanType"] = "AUTOMATIC";
        if (state === "0" || state === "in") scanType = "CHECK_IN";
        if (state === "1" || state === "out") scanType = "CHECK_OUT";

        results.push({
          employeePin: pin,
          timestamp: timeStr ? new Date(timeStr) : new Date(),
          scanType,
          verifyMode: "FINGERPRINT",
          rawPayload: line,
        });
      }
    }
  }

  return results;
}

/**
 * Parses Hikvision ISAPI Access Control Event JSON push format
 */
export function parseHikvisionBody(bodyJson: Record<string, unknown>): Partial<BiometricScanPayload>[] {
  const results: Partial<BiometricScanPayload>[] = [];

  try {
    const event = (bodyJson.AccessControllerEvent || bodyJson.access_event || bodyJson) as Record<string, unknown>;
    const employeePin =
      String(event.employeeNoString || event.employeeNo || event.cardNo || event.user_id || "").trim();
    const eventTimeStr = String(event.eventTime || event.time || event.timestamp || "");

    if (employeePin) {
      const subEventType = Number(event.subEventType || event.event_type || 0);
      let verifyMode: BiometricScanPayload["verifyMode"] = "FINGERPRINT";
      if (subEventType === 21 || subEventType === 75) verifyMode = "FACE";
      if (subEventType === 1 || subEventType === 76) verifyMode = "CARD";

      results.push({
        employeePin,
        timestamp: eventTimeStr ? new Date(eventTimeStr) : new Date(),
        scanType: "AUTOMATIC",
        verifyMode,
        rawPayload: JSON.stringify(bodyJson),
      });
    }
  } catch (error) {
    console.error("Hikvision parser error:", error);
  }

  return results;
}

/**
 * Machine Push URL Instructions
 */
export function getDevicePushInstructions(baseUrl: string) {
  return [
    {
      brand: "Solution / ZKTeco (ADMS Push Server)",
      protocol: "ADMS / iclock HTTP Push",
      serverAddress: `${baseUrl}/api/biometric/push`,
      port: "80 / 443",
      setupSteps: [
        "Masuk ke Menu Mesin -> Comm. / Komunikasi -> Cloud Server / ADMS / Web Server.",
        "Aktifkan Enable Cloud Server / Domain Name.",
        `Isi Server Address / IP: ${baseUrl.replace(/^https?:\/\//, "")}`,
        "Isi Server Port: 443 (jika HTTPS) atau 80 (jika HTTP).",
        `Isi Push URL / Web Push: /api/biometric/push`,
        "Restart mesin untuk memulai push realtime.",
      ],
    },
    {
      brand: "Hikvision (ISAPI HTTP Host)",
      protocol: "ISAPI Event HTTP Push",
      serverAddress: `${baseUrl}/api/biometric/push`,
      port: "80 / 443",
      setupSteps: [
        "Buka Web Admin Mesin Hikvision -> Access Control -> Event Listening / HTTP Host.",
        "Aktifkan HTTP Listening / Event Push.",
        `Isi Host IP / Domain: ${baseUrl.replace(/^https?:\/\//, "")}`,
        "Isi URL Path: /api/biometric/push",
        "Pilih Format Payload: JSON.",
        "Simpan & Uji Koneksi Test Push.",
      ],
    },
  ];
}
