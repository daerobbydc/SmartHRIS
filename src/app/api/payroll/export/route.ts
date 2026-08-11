import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateBCACSV,
  generateMandiriMCMCSV,
  generateBNICSV,
  generateBRICSV,
  generateBSICSV,
  generateGenericBankCSV,
  generateESPT21CSV,
  generateESPT21JSON,
  PayrollExportData,
} from "@/lib/bank-export";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const bank = searchParams.get("bank") || "BCA";
    const format = searchParams.get("format") || "csv"; // csv or json
    const type = searchParams.get("type") || "bank"; // bank or espt

    // Get payroll data with employee info (support PAID, PROCESSED, PENDING)
    const payrolls = await prisma.payroll.findMany({
      where: { month, year, status: { in: ["PAID", "PROCESSED", "PENDING"] } },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get salary data for bank info
    const employeeIds = payrolls.map((p) => p.employeeId);
    const salaries = await prisma.employeeSalary.findMany({
      where: { employeeId: { in: employeeIds } },
    });

    const salaryMap = new Map(salaries.map((s) => [s.employeeId, s]));

    const exportData: PayrollExportData[] = payrolls.map((p) => {
      const salary = salaryMap.get(p.employeeId);
      return {
        employeeId: p.employee.employeeId,
        firstName: p.employee.firstName,
        lastName: p.employee.lastName,
        department: p.employee.department,
        bankName: p.employee.bankName || salary?.bankName || undefined,
        bankAccount: p.employee.bankAccount || salary?.bankAccount || undefined,
        bankBranch: p.employee.bankBranch || salary?.bankBranch || undefined,
        npwp: p.employee.npwp || salary?.npwp || undefined,
        netSalary: Number(p.netSalary),
        pph21: Number(p.tax || p.pph21),
        month: p.month,
        year: p.year,
        email: p.employee.user?.email,
      };
    });

    if (exportData.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data payroll untuk periode ini" },
        { status: 404 }
      );
    }

    let content: string;
    let contentType = "text/csv;charset=utf-8;";
    let filename: string;

    if (type === "espt") {
      if (format === "json") {
        const jsonData = generateESPT21JSON(exportData, month, year);
        return NextResponse.json(jsonData);
      }
      content = generateESPT21CSV(exportData, month, year);
      filename = `eSPT-PPh21-${year}${month.toString().padStart(2, "0")}.csv`;
    } else {
      // Bank export
      const bankCode = bank.toUpperCase();
      switch (bankCode) {
        case "MANDIRI":
          content = generateMandiriMCMCSV(exportData, month, year);
          filename = `Mandiri-MCM-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
        case "BNI":
          content = generateBNICSV(exportData, month, year);
          filename = `BNI-Transfer-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
        case "BRI":
          content = generateBRICSV(exportData, month, year);
          filename = `BRI-BRIVA-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
        case "BSI":
          content = generateBSICSV(exportData, month, year);
          filename = `BSI-CMS-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
        case "BCA":
          content = generateBCACSV(exportData, month, year);
          filename = `BCA-KlikBCA-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
        default:
          content = generateGenericBankCSV(exportData, month, year, bankCode);
          filename = `Bank-${bankCode}-${year}${month.toString().padStart(2, "0")}.csv`;
          break;
      }
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Gagal export data" },
      { status: 500 }
    );
  }
}
