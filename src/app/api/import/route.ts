import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseExcelFile,
  validateImportData,
  generateTemplateXLSX,
  IMPORT_TEMPLATES,
} from "@/lib/import-utils";
import { hash } from "bcryptjs";

// GET - Download template atau list templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template");

    if (template) {
      // Download specific template
      const xlsxBuffer = generateTemplateXLSX(template);

      return new NextResponse(new Uint8Array(xlsxBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="template-${template}.xlsx"`,
        },
      });
    }

    // List all templates
    return NextResponse.json(
      Object.entries(IMPORT_TEMPLATES).map(([key, t]) => ({
        key,
        name: t.name,
        description: t.description,
        headers: t.headers,
      }))
    );
  } catch (error) {
    console.error("Import GET error:", error);
    return NextResponse.json({ error: "Gagal memproses request" }, { status: 500 });
  }
}

// POST - Import data
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "File dan type wajib diisi" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Format file harus Excel (.xlsx, .xls) atau CSV" }, { status: 400 });
    }

    // Parse file
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawData = parseExcelFile(buffer);

    if (rawData.length === 0) {
      return NextResponse.json({ error: "File kosong atau format tidak sesuai" }, { status: 400 });
    }

    // Validate data
    const validation = validateImportData(rawData, type);

    if (!validation.success || !validation.data) {
      return NextResponse.json({
        success: false,
        totalRows: validation.totalRows,
        errorCount: validation.errorCount,
        errors: validation.errors,
      });
    }

    // Import based on type
    let importedCount = 0;

    switch (type) {
      case "employees":
        importedCount = await importEmployees(validation.data);
        break;
      case "payroll":
        importedCount = await importPayroll(validation.data);
        break;
      case "schedule":
        importedCount = await importSchedule(validation.data);
        break;
      case "leave":
        importedCount = await importLeave(validation.data);
        break;
      case "overtime":
        importedCount = await importOvertime(validation.data);
        break;
      case "applicants":
        importedCount = await importApplicants(validation.data);
        break;
      default:
        return NextResponse.json({ error: "Tipe import tidak valid" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      totalRows: validation.totalRows,
      importedCount,
      errorCount: validation.errorCount,
      errors: validation.errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Gagal import data" }, { status: 500 });
  }
}

// ==================== IMPORT FUNCTIONS ====================

async function importEmployees(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;

  for (const row of data) {
    try {
      // Create user first
      const password = await hash("password123", 10);
      const user = await prisma.user.create({
        data: {
          email: row.email as string,
          password,
          role: "EMPLOYEE",
        },
      });

      // Create employee
      await prisma.employee.create({
        data: {
          userId: user.id,
          employeeId: row.employeeId as string,
          firstName: row.firstName as string,
          lastName: row.lastName as string,
          phone: row.phone as string || null,
          department: row.department as string,
          position: row.position as string,
          hireDate: row.hireDate as Date,
          salary: row.salary as number,
          gender: (row.gender as "MALE" | "FEMALE") || null,
          status: (row.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
        },
      });

      // Create salary record
      await prisma.employeeSalary.create({
        data: {
          employeeId: (await prisma.employee.findFirst({ where: { employeeId: row.employeeId as string } }))?.id || "",
          baseSalary: row.salary as number,
        },
      });

      count++;
    } catch (error) {
      console.error(`Import employee error for ${row.employeeId}:`, error);
    }
  }

  return count;
}

async function importPayroll(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  for (const row of data) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { employeeId: row.employeeId as string },
      });

      if (!employee) continue;

      await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          month,
          year,
          baseSalary: (row.baseSalary as number) || employee.salary.toNumber(),
          allowance: (row.allowance as number) || 0,
          deduction: (row.deduction as number) || 0,
          overtime: (row.overtime as number) || 0,
          bonus: (row.bonus as number) || 0,
          netSalary: 0, // Will be calculated
        },
      });

      count++;
    } catch (error) {
      console.error(`Import payroll error for ${row.employeeId}:`, error);
    }
  }

  return count;
}

async function importSchedule(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;

  for (const row of data) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { employeeId: row.employeeId as string },
      });

      if (!employee) continue;

      // Find or create work schedule
      let schedule = await prisma.workSchedule.findFirst({
        where: { name: row.scheduleName as string },
      });

      if (!schedule) {
        schedule = await prisma.workSchedule.create({
          data: {
            name: row.scheduleName as string,
            startTime: "08:00",
            endTime: "17:00",
          },
        });
      }

      await prisma.employeeSchedule.create({
        data: {
          employeeId: employee.id,
          scheduleId: schedule.id,
          startDate: row.startDate as Date,
          endDate: row.endDate as Date || null,
          dayOfWeek: (row.dayOfWeek as number) || null,
        },
      });

      count++;
    } catch (error) {
      console.error(`Import schedule error for ${row.employeeId}:`, error);
    }
  }

  return count;
}

async function importLeave(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;

  for (const row of data) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { employeeId: row.employeeId as string },
      });

      if (!employee) continue;

      await prisma.leave.create({
        data: {
          employeeId: employee.id,
          type: row.type as "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID",
          startDate: row.startDate as Date,
          endDate: row.endDate as Date,
          reason: row.reason as string || null,
        },
      });

      count++;
    } catch (error) {
      console.error(`Import leave error for ${row.employeeId}:`, error);
    }
  }

  return count;
}

async function importOvertime(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;

  for (const row of data) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { employeeId: row.employeeId as string },
      });

      if (!employee) continue;

      const date = row.date as Date;
      const startTime = new Date(`${date.toISOString().split("T")[0]}T${row.startTime}`);
      const endTime = new Date(`${date.toISOString().split("T")[0]}T${row.endTime}`);

      await prisma.overtime.create({
        data: {
          employeeId: employee.id,
          date: date,
          startTime,
          endTime,
          hours: row.hours as number,
          reason: row.reason as string,
        },
      });

      count++;
    } catch (error) {
      console.error(`Import overtime error for ${row.employeeId}:`, error);
    }
  }

  return count;
}

async function importApplicants(data: Record<string, unknown>[]): Promise<number> {
  let count = 0;

  for (const row of data) {
    try {
      await prisma.applicant.create({
        data: {
          vacancyId: row.vacancyId as string,
          name: row.name as string,
          email: row.email as string,
          phone: row.phone as string || null,
          source: row.source as string || null,
        },
      });

      count++;
    } catch (error) {
      console.error(`Import applicant error for ${row.name}:`, error);
    }
  }

  return count;
}
