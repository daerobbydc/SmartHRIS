import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculatePPh21TER,
  calculateBPJSTK,
  calculateBPJSKes,
  calculateNetSalary,
} from "@/lib/payroll-indonesia";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, month, year, allowance = 0, deduction = 0, overtime = 0, bonus = 0, thr = 0 } = body;

    // Get employee data
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Get salary data
    const salaryData = await prisma.employeeSalary.findUnique({
      where: { employeeId },
    });

    if (!salaryData) {
      return NextResponse.json({ error: "Data gaji karyawan tidak ditemukan" }, { status: 404 });
    }

    const baseSalary = Number(salaryData.baseSalary);
    const ptkpCode = salaryData.ptkp || "TK/0";
    const isDecember = month === 12;

    // Get previous months gross income for December calculation
    let previousMonthsGross = 0;
    if (isDecember) {
      const prevPayrolls = await prisma.payroll.findMany({
        where: { employeeId, year, month: { lt: month } },
      });
      previousMonthsGross = prevPayrolls.reduce((sum, p) => sum + Number(p.grossIncome), 0);
    }

    // Calculate PPh 21 TER
    const pph21Result = calculatePPh21TER(baseSalary, ptkpCode, isDecember, previousMonthsGross);

    // Calculate BPJS
    const bpjsTK = calculateBPJSTK(baseSalary, allowance);
    const bpjsKes = calculateBPJSKes(baseSalary, allowance);

    // Calculate net salary
    const grossIncome = pph21Result.grossIncome;
    const totalDeduction = deduction + pph21Result.pph21 + bpjsTK.jhtEmployee + bpjsTK.jpEmployee + bpjsKes.employee;
    const netSalary = Math.max(0, grossIncome + allowance + overtime + bonus + thr - totalDeduction);

    return NextResponse.json({
      baseSalary,
      grossIncome,
      allowance,
      overtime,
      bonus,
      thr,
      // PPh 21
      pph21: pph21Result.pph21,
      pph21Type: pph21Result.pph21Type,
      effectiveRate: pph21Result.effectiveRate,
      ptkpDeduction: pph21Result.ptkpDeduction,
      pkp: pph21Result.pkp,
      // BPJS
      bpjs: {
        jhtEmployee: bpjsTK.jhtEmployee,
        jhtEmployer: bpjsTK.jhtEmployer,
        jpEmployee: bpjsTK.jpEmployee,
        jpEmployer: bpjsTK.jpEmployer,
        jkk: bpjsTK.jkk,
        jkm: bpjsTK.jkm,
        kesehatanEmployee: bpjsKes.employee,
        kesehatanEmployer: bpjsKes.employer,
      },
      // Totals
      totalDeduction,
      netSalary,
    });
  } catch (error) {
    console.error("Payroll calculate error:", error);
    return NextResponse.json({ error: "Gagal menghitung payroll" }, { status: 500 });
  }
}
