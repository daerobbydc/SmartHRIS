import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  generatePayslipPDF,
  generateSPT21PDF,
  generateSKKerjaPDF,
  generatePaklaringPDF,
  generateAttendanceReportPDF,
  generateContractPDF,
  generateWarningLetterPDF,
} from "@/lib/pdf-export";

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
      case "paklaring":
        if (!id) {
          return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
        }
        pdfBuffer = await generatePaklaringPDF(id);
        filename = `Paklaring_Surat_Keterangan_Kerja_${id}.pdf`;
        break;

      case "contract":
        if (!id) {
          return NextResponse.json({ error: "Contract ID required" }, { status: 400 });
        }
        pdfBuffer = await generateContractPDF(id);
        filename = `Surat_Perjanjian_Kerja_${id}.pdf`;
        break;

      case "warning-letter":
      case "sp":
        if (!id) {
          return NextResponse.json({ error: "Sanction ID required" }, { status: 400 });
        }
        pdfBuffer = await generateWarningLetterPDF(id);
        filename = `Surat_Peringatan_SP_${id}.pdf`;
        break;

      case "attendance-report":
        pdfBuffer = await generateAttendanceReportPDF(month, year, department);
        filename = `attendance-report-${month}-${year}.pdf`;
        break;

      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
