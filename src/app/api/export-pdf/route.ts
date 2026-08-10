import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { generatePayslipPDF, generateSPT21PDF, generateSKKerjaPDF, generateAttendanceReportPDF } from "@/lib/pdf-export";

// GET - Generate PDF
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const month = parseInt(searchParams.get("month") || "1");
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const department = searchParams.get("department") || undefined;

  try {
    let pdfBuffer: Buffer;
    let filename: string;

    switch (type) {
      case "payslip":
        if (!id) {
          return NextResponse.json({ error: "Payroll ID required" }, { status: 400 });
        }
        pdfBuffer = await generatePayslipPDF(id);
        filename = `payslip-${month}-${year}.pdf`;
        break;

      case "spt21":
        if (!id) {
          return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
        }
        pdfBuffer = await generateSPT21PDF(id, year);
        filename = `spt21-${id}-${year}.pdf`;
        break;

      case "sk-kerja":
        if (!id) {
          return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
        }
        pdfBuffer = await generateSKKerjaPDF(id);
        filename = `sk-kerja-${id}.pdf`;
        break;

      case "attendance-report":
        pdfBuffer = await generateAttendanceReportPDF(month, year, department);
        filename = `attendance-report-${month}-${year}.pdf`;
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
  }
}
