import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { generatePaklaringPDF } from "@/lib/pdf-export";

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const documentNumber = searchParams.get("documentNumber") || undefined;
    const companyName = searchParams.get("companyName") || undefined;
    const hrSignName = searchParams.get("hrSignName") || undefined;
    const hrSignTitle = searchParams.get("hrSignTitle") || undefined;

    if (!employeeId) {
      return NextResponse.json({ error: "EmployeeId wajib diisi" }, { status: 400 });
    }

    const pdfBuffer = await generatePaklaringPDF(employeeId, {
      documentNumber,
      companyName,
      hrSignName,
      hrSignTitle,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Surat_Keterangan_Kerja_Paklaring_${employeeId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Paklaring PDF GET Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal mengunduh dokumen Paklaring PDF" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { employeeId, documentNumber, companyName, hrSignName, hrSignTitle } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "EmployeeId wajib diisi" }, { status: 400 });
    }

    const pdfBuffer = await generatePaklaringPDF(employeeId, {
      documentNumber,
      companyName,
      hrSignName,
      hrSignTitle,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Surat_Keterangan_Kerja_Paklaring_${employeeId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Paklaring PDF POST Error:", error);
    return NextResponse.json({ error: error?.message || "Gagal mencetak Paklaring PDF" }, { status: 500 });
  }
}
