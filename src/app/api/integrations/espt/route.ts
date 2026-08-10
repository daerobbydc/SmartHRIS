import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { generateESPTData, generateESPTCSV, generateESPTJSON } from "@/lib/espt-integration";

// GET - Generate E-SPT data
export async function GET(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const format = searchParams.get("format") || "json";

  try {
    const data = await generateESPTData(month, year);

    if (format === "csv") {
      const csv = generateESPTCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="espt-21-${month}-${year}.csv"`,
        },
      });
    }

    return NextResponse.json(generateESPTJSON(data));
  } catch (error) {
    console.error("E-SPT error:", error);
    return NextResponse.json({ error: "Gagal generate E-SPT" }, { status: 500 });
  }
}
