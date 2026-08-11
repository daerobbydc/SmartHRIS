import { NextRequest, NextResponse } from "next/server";
import { getCompanyInfo, updateCompanyInfo } from "@/lib/company-config";
import { checkAuth } from "@/lib/api-auth";

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

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const updated = await updateCompanyInfo(body);
    return NextResponse.json({
      message: "Profil & Gambar Kop Perusahaan berhasil diperbarui",
      company: updated,
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil perusahaan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
