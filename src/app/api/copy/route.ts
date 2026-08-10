import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Copy payroll from previous month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceMonth, sourceYear, targetMonth, targetYear, type } = body;

    if (type === "payroll") {
      return await copyPayroll(sourceMonth, sourceYear, targetMonth, targetYear);
    }

    if (type === "schedule") {
      return await copySchedule(sourceMonth, sourceYear, targetMonth, targetYear);
    }

    return NextResponse.json({ error: "Tipe copy tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Copy data error:", error);
    return NextResponse.json({ error: "Gagal menyalin data" }, { status: 500 });
  }
}

async function copyPayroll(sourceMonth: number, sourceYear: number, targetMonth: number, targetYear: number) {
  // Get source payroll data
  const sourcePayrolls = await prisma.payroll.findMany({
    where: { month: sourceMonth, year: sourceYear },
    include: { employee: true },
  });

  if (sourcePayrolls.length === 0) {
    return NextResponse.json({ error: "Tidak ada data payroll untuk periode sumber" }, { status: 404 });
  }

  // Check if target already has data
  const existingTarget = await prisma.payroll.count({
    where: { month: targetMonth, year: targetYear },
  });

  if (existingTarget > 0) {
    return NextResponse.json({
      error: `Sudah ada ${existingTarget} data payroll untuk periode ${targetMonth}/${targetYear}`,
      existingCount: existingTarget,
    }, { status: 400 });
  }

  // Copy payroll data
  let copiedCount = 0;
  for (const source of sourcePayrolls) {
    try {
      await prisma.payroll.create({
        data: {
          employeeId: source.employeeId,
          month: targetMonth,
          year: targetYear,
          baseSalary: source.baseSalary,
          allowance: source.allowance,
          deduction: source.deduction,
          overtime: source.overtime,
          bonus: source.bonus,
          thr: source.thr,
          // Copy BPJS and PPh21 settings
          pph21: source.pph21,
          pph21Type: source.pph21Type,
          grossIncome: source.grossIncome,
          bpjsJhtEmployee: source.bpjsJhtEmployee,
          bpjsJhtEmployer: source.bpjsJhtEmployer,
          bpjsJpEmployee: source.bpjsJpEmployee,
          bpjsJpEmployer: source.bpjsJpEmployer,
          bpjsJkk: source.bpjsJkk,
          bpjsJkm: source.bpjsJkm,
          bpjsKesehatanEmployee: source.bpjsKesehatanEmployee,
          bpjsKesehatanEmployer: source.bpjsKesehatanEmployer,
          totalDeduction: source.totalDeduction,
          netSalary: source.netSalary,
          status: "PENDING", // Reset status to pending
        },
      });
      copiedCount++;
    } catch (error) {
      console.error(`Copy payroll error for employee ${source.employeeId}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${copiedCount} data payroll berhasil disalin dari ${sourceMonth}/${sourceYear} ke ${targetMonth}/${targetYear}`,
    copiedCount,
    totalSource: sourcePayrolls.length,
  });
}

async function copySchedule(sourceMonth: number, sourceYear: number, targetMonth: number, targetYear: number) {
  // Get source schedule data
  const sourceSchedules = await prisma.employeeSchedule.findMany({
    where: {
      startDate: {
        gte: new Date(sourceYear, sourceMonth - 1, 1),
        lt: new Date(sourceYear, sourceMonth, 1),
      },
    },
  });

  if (sourceSchedules.length === 0) {
    return NextResponse.json({ error: "Tidak ada data jadwal untuk periode sumber" }, { status: 404 });
  }

  // Copy schedule data
  let copiedCount = 0;
  for (const source of sourceSchedules) {
    try {
      // Calculate new dates (shift by 1 month)
      const newStartDate = new Date(source.startDate);
      newStartDate.setMonth(newStartDate.getMonth() + (targetMonth - sourceMonth));
      newStartDate.setFullYear(targetYear);

      let newEndDate: Date | null = null;
      if (source.endDate) {
        newEndDate = new Date(source.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + (targetMonth - sourceMonth));
        newEndDate.setFullYear(targetYear);
      }

      await prisma.employeeSchedule.create({
        data: {
          employeeId: source.employeeId,
          scheduleId: source.scheduleId,
          startDate: newStartDate,
          endDate: newEndDate,
          dayOfWeek: source.dayOfWeek,
          isRoster: source.isRoster,
        },
      });
      copiedCount++;
    } catch (error) {
      console.error(`Copy schedule error for employee ${source.employeeId}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${copiedCount} data jadwal berhasil disalin`,
    copiedCount,
    totalSource: sourceSchedules.length,
  });
}
