import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  processBiometricScan,
  parseADMSBody,
  BiometricScanPayload,
} from "@/lib/fingerprint-integration";

// GET /api/integrations/fingerprint - Handshake or fetch logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const SN = searchParams.get("SN") || searchParams.get("deviceCode");
    const option = searchParams.get("option");

    // ADMS handshake response
    if (SN && option === "all") {
      return new NextResponse("OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Regular query
    const logs = await prisma.biometricLog.findMany({
      include: {
        device: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Fingerprint GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/integrations/fingerprint - Realtime Webhook Receiver
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceCodeHeader =
      request.headers.get("x-device-code") ||
      searchParams.get("SN") ||
      searchParams.get("deviceCode");

    const contentType = request.headers.get("content-type") || "";
    let processedResults = [];

    if (contentType.includes("application/json")) {
      // 1. JSON Payload Format
      const body = await request.json();
      const payloadArray: BiometricScanPayload[] = Array.isArray(body)
        ? body
        : body.logs
        ? body.logs
        : [body];

      for (const item of payloadArray) {
        const result = await processBiometricScan({
          deviceCode: item.deviceCode || deviceCodeHeader || "FP-DEFAULT-01",
          secretToken: item.secretToken,
          employeePin: item.employeePin,
          timestamp: item.timestamp || new Date(),
          scanType: item.scanType || "AUTOMATIC",
          verifyMode: item.verifyMode || "FINGERPRINT",
          rawPayload: JSON.stringify(item),
        });
        processedResults.push(result);
      }
    } else {
      // 2. Native ADMS / Plain Text / Form-Data Format (ZKTeco/Solution)
      const textBody = await request.text();
      const parsedLogs = parseADMSBody(textBody);

      if (parsedLogs.length === 0) {
        // Fallback: search params or URL encoded form
        const params = new URLSearchParams(textBody);
        const pin = params.get("pin") || params.get("employeePin");
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
            deviceCode: deviceCodeHeader || "FP-ADMS-01",
            employeePin: item.employeePin,
            timestamp: item.timestamp || new Date(),
            scanType: item.scanType || "AUTOMATIC",
            verifyMode: item.verifyMode || "FINGERPRINT",
            rawPayload: item.rawPayload || textBody,
          });
          processedResults.push(result);
        }
      }
    }

    // Return OK string for ADMS hardware machines or JSON for API clients
    if (searchParams.get("SN")) {
      return new NextResponse("OK", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return NextResponse.json({
      message: "Proses webhook fingerprint realtime berhasil",
      count: processedResults.length,
      results: processedResults,
    });
  } catch (error) {
    console.error("Fingerprint POST error:", error);
    return NextResponse.json(
      { error: "Gagal memproses webhook fingerprint" },
      { status: 500 }
    );
  }
}
