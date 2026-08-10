import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";
import {
  calculatePPh21TER,
  calculateBPJSTK,
  calculateBPJSKes,
} from "@/lib/payroll-indonesia";

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request, { requiredPermission: "payroll:read" });
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: { employeeId: true, firstName: true, lastName: true, department: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(payrolls);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request, { requiredPermission: "payroll:write" });
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // Get employee & salary data for auto-calculation
    const targetEmpId = body.employeeId;
    if (!targetEmpId) {
      return NextResponse.json({ error: "ID Karyawan wajib diisi" }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: targetEmpId },
          { employeeId: targetEmpId },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    const salaryData = await prisma.employeeSalary.findFirst({
      where: {
        OR: [
          { employeeId: employee.id },
          { employeeId: employee.employeeId },
        ],
      },
    });

    const parsedBase = parseFloat(
      body.baseSalary !== undefined && body.baseSalary !== ""
        ? body.baseSalary
        : salaryData?.baseSalary
        ? salaryData.baseSalary.toString()
        : employee.salary
        ? employee.salary.toString()
        : "5000000"
    );
    const baseSalary = isNaN(parsedBase) || parsedBase < 0 ? 5000000 : parsedBase;

    const allowance = isNaN(parseFloat(body.allowance)) ? 0 : parseFloat(body.allowance);
    const deduction = isNaN(parseFloat(body.deduction)) ? 0 : parseFloat(body.deduction);
    const overtime = isNaN(parseFloat(body.overtime)) ? 0 : parseFloat(body.overtime);
    const bonus = isNaN(parseFloat(body.bonus)) ? 0 : parseFloat(body.bonus);
    const thr = isNaN(parseFloat(body.thr)) ? 0 : parseFloat(body.thr);
    const month = parseInt(body.month) || new Date().getMonth() + 1;
    const year = parseInt(body.year) || new Date().getFullYear();

    // Auto-calculate PPh 21
    const ptkpCode = salaryData?.ptkp || employee.ptkp || "TK/0";
    const isDecember = month === 12;
    let previousMonthsGross = 0;

    if (isDecember) {
      const prevPayrolls = await prisma.payroll.findMany({
        where: { employeeId: employee.id, year, month: { lt: month } },
      });
      previousMonthsGross = prevPayrolls.reduce((sum, p) => sum + Number(p.grossIncome), 0);
    }

    const pph21Result = calculatePPh21TER(baseSalary, ptkpCode, isDecember, previousMonthsGross);

    // Auto-calculate BPJS
    const bpjsTK = calculateBPJSTK(baseSalary, allowance);
    const bpjsKes = calculateBPJSKes(baseSalary, allowance);

    // Calculate totals
    const grossIncome = baseSalary + allowance + overtime + bonus + thr;
    const totalDeduction = deduction + pph21Result.pph21 + bpjsTK.jhtEmployee + bpjsTK.jpEmployee + bpjsKes.employee;
    const netSalary = Math.max(0, grossIncome - totalDeduction);

    // Check if payroll record already exists for this employee, month, and year
    const existing = await prisma.payroll.findFirst({
      where: {
        employeeId: employee.id,
        month,
        year,
      },
    });

    const updateData = {
      baseSalary,
      allowance,
      deduction,
      tax: pph21Result.pph21,
      overtime,
      bonus,
      thr,
      // PPh 21
      pph21: pph21Result.pph21,
      pph21Type: pph21Result.pph21Type,
      grossIncome,
      // BPJS
      bpjsJhtEmployee: bpjsTK.jhtEmployee,
      bpjsJhtEmployer: bpjsTK.jhtEmployer,
      bpjsJpEmployee: bpjsTK.jpEmployee,
      bpjsJpEmployer: bpjsTK.jpEmployer,
      bpjsJkk: bpjsTK.jkk,
      bpjsJkm: bpjsTK.jkm,
      bpjsKesehatanEmployee: bpjsKes.employee,
      bpjsKesehatanEmployer: bpjsKes.employer,
      // Net
      totalDeduction,
      netSalary,
      status: "PAID" as const,
      paidAt: new Date(),
    };

    let payroll;
    if (existing) {
      payroll = await prisma.payroll.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      payroll = await prisma.payroll.create({
        data: {
          ...updateData,
          month,
          year,
          employee: { connect: { id: employee.id } },
        },
      });
    }
    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    console.error("Payroll POST error:", error);
    return NextResponse.json(
      { error: "Gagal menghitung payroll", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const payroll = await prisma.payroll.update({
      where: { id: id! },
      data: body,
    });
    return NextResponse.json(payroll);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
