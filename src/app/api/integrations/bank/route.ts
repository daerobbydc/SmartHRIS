import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { getBankTransferData, generateBankFile } from "@/lib/bank-integration";

// GET - Generate bank transfer file
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const bankCode = searchParams.get("bank") || "BCA";

  try {
    const transfers = await getBankTransferData(month, year);
    const bankFile = generateBankFile(transfers, bankCode);

    return new NextResponse(bankFile.content, {
      headers: {
        "Content-Type": bankFile.contentType,
        "Content-Disposition": `attachment; filename="${bankFile.filename}"`,
      },
    });
  } catch (error) {
    console.error("Bank integration error:", error);
    return NextResponse.json({ error: "Gagal generate file bank" }, { status: 500 });
  }
}
