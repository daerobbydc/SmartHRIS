import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { generateBPJSSubmission, generateBPJSCSV, submitToBPJS } from "@/lib/bpjs-integration";

// GET - Get BPJS submission data
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const format = searchParams.get("format") || "json";

  try {
    const submissions = await generateBPJSSubmission(month, year);

    if (format === "csv") {
      const csv = generateBPJSCSV(submissions);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="bpjs-${month}-${year}.csv"`,
        },
      });
    }

    return NextResponse.json({ submissions, month, year });
  } catch (error) {
    console.error("BPJS error:", error);
    return NextResponse.json({ error: "Gagal mengambil data BPJS" }, { status: 500 });
  }
}

// POST - Submit to BPJS
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { month, year } = await req.json();
    const result = await submitToBPJS(month, year);
    return NextResponse.json(result);
  } catch (error) {
    console.error("BPJS submission error:", error);
    return NextResponse.json({ error: "Gagal submit ke BPJS" }, { status: 500 });
  }
}
