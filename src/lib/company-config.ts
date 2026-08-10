import { prisma } from "@/lib/prisma";

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
  hrSignName?: string;
  hrSignTitle?: string;
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const mainOffice = await prisma.branchOffice.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (mainOffice) {
      return {
        name: mainOffice.name || "PT SmartHRIS Indonesia",
        address: mainOffice.address || "Jl. Teknologi No. 123, Jakarta Selatan",
        phone: mainOffice.phone || "021-1234-5678",
        email: mainOffice.email || "info@smarthris.com",
        npwp: mainOffice.npwp || "12.345.678.9-012.000",
        hrSignName: "Budi Santoso, M.Psi",
        hrSignTitle: "Head of Human Capital Management",
      };
    }
  } catch (error) {
    console.error("Error fetching company info from DB:", error);
  }

  return {
    name: process.env.COMPANY_NAME || "PT SmartHRIS Indonesia",
    address: process.env.COMPANY_ADDRESS || "Jl. Teknologi No. 123, Jakarta Selatan",
    phone: process.env.COMPANY_PHONE || "021-1234-5678",
    email: process.env.COMPANY_EMAIL || "info@smarthris.com",
    npwp: process.env.COMPANY_NPWP || "12.345.678.9-012.000",
    hrSignName: "Budi Santoso, M.Psi",
    hrSignTitle: "Head of Human Capital Management",
  };
}
