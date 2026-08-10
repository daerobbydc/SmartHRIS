import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY || "smarthris-mobile-2026";

function checkMobileApiKey(req: NextRequest): boolean {
  const apiKey =
    req.headers.get("x-mobile-api-key") ||
    new URL(req.url).searchParams.get("apiKey");
  return apiKey === MOBILE_API_KEY;
}

// GET /api/mobile/employees?email=... — Fetch employee profile for mobile login
export async function GET(req: NextRequest) {
  if (!checkMobileApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized — x-mobile-api-key header required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};

    if (email) {
      // Join via User table since email is stored there
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          employee: true,
        },
      });

      if (!user || !user.employee) {
        return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
      }

      const emp = user.employee;
      return NextResponse.json(
        [
          {
            id: emp.id,
            employeeId: emp.employeeId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department,
            position: emp.position,
            phone: emp.phone,
          },
        ],
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        phone: true,
      },
      take: 10,
    });

    return NextResponse.json(employees, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mobile employees GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data karyawan" },
      { status: 500 }
    );
  }
}
