import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateBCACSV,
  generateMandiriMCMCSV,
  generateBNICSV,
  generateBRICSV,
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

    // Get payroll data with employee info
    const payrolls = await prisma.payroll.findMany({
      where: { month, year, status: "PAID" },
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
        bankName: salary?.bankName || undefined,
        bankAccount: salary?.bankAccount || undefined,
        bankBranch: salary?.bankBranch || undefined,
        npwp: salary?.npwp || undefined,
        netSalary: Number(p.netSalary),
        pph21: Number(p.tax),
        month: p.month,
        year: p.year,
      };
    });

    if (exportData.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data payroll untuk periode ini" },
        { status: 404 }
      );
    }

    let content: string;
    let contentType = "text/csv";
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
      switch (bank.toUpperCase()) {
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
        case "BCA":
        default:
          content = generateBCACSV(exportData, month, year);
          filename = `BCA-KlikBCA-${year}${month.toString().padStart(2, "0")}.csv`;
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
