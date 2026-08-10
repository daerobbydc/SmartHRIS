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
    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    const salaryData = await prisma.employeeSalary.findUnique({
      where: { employeeId: body.employeeId },
    });

    const baseSalary = parseFloat(
      body.baseSalary !== undefined && body.baseSalary !== ""
        ? body.baseSalary
        : salaryData?.baseSalary
        ? salaryData.baseSalary.toString()
        : employee.salary
        ? employee.salary.toString()
        : "5000000"
    );

    const allowance = parseFloat(body.allowance || 0);
    const deduction = parseFloat(body.deduction || 0);
    const overtime = parseFloat(body.overtime || 0);
    const bonus = parseFloat(body.bonus || 0);
    const thr = parseFloat(body.thr || 0);
    const month = parseInt(body.month);
    const year = parseInt(body.year);

    // Auto-calculate PPh 21
    const ptkpCode = salaryData?.ptkp || employee.ptkp || "TK/0";
    const isDecember = month === 12;
    let previousMonthsGross = 0;

    if (isDecember) {
      const prevPayrolls = await prisma.payroll.findMany({
        where: { employeeId: body.employeeId, year, month: { lt: month } },
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
        employeeId: body.employeeId,
        month,
        year,
      },
    });

    const payrollData = {
      employeeId: body.employeeId,
      month,
      year,
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
        data: payrollData,
      });
    } else {
      payroll = await prisma.payroll.create({
        data: payrollData,
      });
    }
    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    console.error("Payroll POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
