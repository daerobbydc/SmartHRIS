import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import {
  getBankTransferData,
  generateBankFile,
  getBankTransferSummary,
  BANK_CONFIGS,
} from "@/lib/bank-integration";

// GET - Generate bank transfer file or summary
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const bankCode = (searchParams.get("bank") || "ALL").toUpperCase();
  const format = (searchParams.get("format") || "csv").toLowerCase() as "csv" | "txt";
  const action = searchParams.get("action") || "download";

  try {
    const transfers = await getBankTransferData(month, year, bankCode);

    if (action === "summary") {
      const summary = getBankTransferSummary(transfers);
      return NextResponse.json({
        month,
        year,
        bankCode,
        supportedBanks: Object.values(BANK_CONFIGS),
        summary,
        transfers,
      });
    }

    if (transfers.length === 0) {
      return NextResponse.json(
        { error: `Tidak ada data transfer gaji untuk bank ${bankCode} pada periode ${month}/${year}` },
        { status: 404 }
      );
    }

    const bankFile = generateBankFile(transfers, bankCode, format);

    return new NextResponse(bankFile.content, {
      headers: {
        "Content-Type": bankFile.contentType,
        "Content-Disposition": `attachment; filename="${bankFile.filename}"`,
      },
    });
  } catch (error) {
    console.error("Bank integration error:", error);
    return NextResponse.json(
      { error: "Gagal generate file transfer bank", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
