import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  processBiometricScan,
  parseADMSBody,
  parseHikvisionBody,
  BiometricScanPayload,
} from "@/lib/fingerprint-integration";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

// GET /api/biometric/push - ADMS Machine Handshake & Heartbeat PING
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const SN = searchParams.get("SN") || searchParams.get("deviceCode") || searchParams.get("sn");
    const clientIp = getClientIp(request);

    if (SN) {
      // Find or register device & update heartbeat status
      await prisma.biometricDevice.upsert({
        where: { deviceCode: SN },
        update: {
          status: "ONLINE",
          lastSyncAt: new Date(),
          ipAddress: clientIp,
        },
        create: {
          deviceCode: SN,
          name: `Mesin Fingerprint (${SN})`,
          location: "Lokasi Default Kantor",
          status: "ONLINE",
          ipAddress: clientIp,
          lastSyncAt: new Date(),
        },
      });

      // ZKTeco & Solution ADMS protocol expects exact "OK" string text/plain response
      return new NextResponse("OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return NextResponse.json({
      status: "ACTIVE",
      message: "Endpoint Biometric Realtime Push Webhook Siap",
      endpoint: "/api/biometric/push",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Biometric Push GET Error:", error);
    return new NextResponse("OK", { headers: { "Content-Type": "text/plain" } });
  }
}

// POST /api/biometric/push - Realtime Attendance Push Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIp = getClientIp(request);
    const deviceCodeHeader =
      request.headers.get("x-device-code") ||
      request.headers.get("x-serial-number") ||
      searchParams.get("SN") ||
      searchParams.get("deviceCode") ||
      searchParams.get("sn") ||
      "FP-PUSH-01";

    const contentType = request.headers.get("content-type") || "";
    let processedResults = [];

    if (contentType.includes("application/json")) {
      // 1. JSON Payload Format (Hikvision / Custom REST Webhook)
      const body = await request.json();

      if (body.AccessControllerEvent || body.access_event) {
        // Hikvision ISAPI format
        const hikLogs = parseHikvisionBody(body);
        for (const item of hikLogs) {
          if (item.employeePin) {
            const result = await processBiometricScan({
              deviceCode: deviceCodeHeader,
              employeePin: item.employeePin,
              timestamp: item.timestamp || new Date(),
              scanType: item.scanType || "AUTOMATIC",
              verifyMode: item.verifyMode || "FACE",
              rawPayload: JSON.stringify(body),
              ipAddress: clientIp,
            });
            processedResults.push(result);
          }
        }
      } else {
        // Generic JSON Push format
        const payloadArray: BiometricScanPayload[] = Array.isArray(body)
          ? body
          : body.logs
          ? body.logs
          : [body];

        for (const item of payloadArray) {
          const result = await processBiometricScan({
            deviceCode: item.deviceCode || deviceCodeHeader,
            secretToken: item.secretToken,
            employeePin: item.employeePin,
            timestamp: item.timestamp || new Date(),
            scanType: item.scanType || "AUTOMATIC",
            verifyMode: item.verifyMode || "FINGERPRINT",
            rawPayload: JSON.stringify(item),
            ipAddress: clientIp,
          });
          processedResults.push(result);
        }
      }
    } else {
      // 2. Native ADMS / Plain Text / Form-Data Format (ZKTeco / Solution)
      const textBody = await request.text();
      const parsedLogs = parseADMSBody(textBody);

      if (parsedLogs.length === 0 && textBody.trim().length > 0) {
        const params = new URLSearchParams(textBody);
        const pin = params.get("pin") || params.get("employeePin") || params.get("user_id");
        if (pin) {
          parsedLogs.push({
            employeePin: pin,
            timestamp: new Date(),
            scanType: "AUTOMATIC",
          });
        }
      }

      for (const item of parsedLogs) {
        if (item.employeePin) {
          const result = await processBiometricScan({
            deviceCode: deviceCodeHeader,
            employeePin: item.employeePin,
            timestamp: item.timestamp || new Date(),
            scanType: item.scanType || "AUTOMATIC",
            verifyMode: item.verifyMode || "FINGERPRINT",
            rawPayload: item.rawPayload || textBody,
            ipAddress: clientIp,
          });
          processedResults.push(result);
        }
      }
    }

    // Always update device heartbeat even if no logs
    await prisma.biometricDevice.upsert({
      where: { deviceCode: deviceCodeHeader },
      update: { status: "ONLINE", lastSyncAt: new Date(), ipAddress: clientIp },
      create: {
        deviceCode: deviceCodeHeader,
        name: `Mesin Fingerprint (${deviceCodeHeader})`,
        location: "Lokasi Default Kantor",
        status: "ONLINE",
        ipAddress: clientIp,
        lastSyncAt: new Date(),
      },
    });

    // Hardware machines expect "OK" string response
    if (searchParams.get("SN") || searchParams.get("table")) {
      return new NextResponse("OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return NextResponse.json({
      message: "Log presensi biometric berhasil diproses",
      deviceCode: deviceCodeHeader,
      clientIp,
      count: processedResults.length,
      results: processedResults,
    });
  } catch (error) {
    console.error("Biometric Push POST Error:", error);
    return new NextResponse("OK", { headers: { "Content-Type": "text/plain" } });
  }
}
