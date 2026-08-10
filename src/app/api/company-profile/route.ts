import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/company-config";

export async function GET() {
  try {
    const company = await getCompanyInfo();
    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}
