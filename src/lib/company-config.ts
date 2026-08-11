import { prisma } from "@/lib/prisma";

export interface CompanyInfo {
  name: string;
  code?: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
  bpjsKetenagakerjaan?: string;
  bpjsKesehatan?: string;
  hrSignName?: string;
  hrSignTitle?: string;
  letterheadLogo?: string; // Base64 data URI or image URL
}

// Global in-memory company settings store for custom settings & letterhead image
let globalCompanySettingsStore: CompanyInfo = {
  name: "PT SmartHRIS Indonesia",
  code: "HO-JKT",
  address: "Jl. Teknologi No. 123, Jakarta Selatan, DKI Jakarta 12930",
  phone: "021-1234-5678",
  email: "info@smarthris.com",
  npwp: "12.345.678.9-012.000",
  bpjsKetenagakerjaan: "00123940129",
  bpjsKesehatan: "00018293019",
  hrSignName: "Budi Santoso, M.Psi",
  hrSignTitle: "Head of Human Capital Management",
  letterheadLogo: undefined,
};

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const mainOffice = await prisma.branchOffice.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (mainOffice) {
      return {
        ...globalCompanySettingsStore,
        name: mainOffice.name || globalCompanySettingsStore.name,
        code: mainOffice.code || globalCompanySettingsStore.code,
        address: mainOffice.address || globalCompanySettingsStore.address,
        phone: mainOffice.phone || globalCompanySettingsStore.phone,
        email: mainOffice.email || globalCompanySettingsStore.email,
        npwp: mainOffice.npwp || globalCompanySettingsStore.npwp,
      };
    }
  } catch (error) {
    console.error("Error fetching company info from DB:", error);
  }

  return globalCompanySettingsStore;
}

export async function updateCompanyInfo(data: Partial<CompanyInfo>): Promise<CompanyInfo> {
  globalCompanySettingsStore = {
    ...globalCompanySettingsStore,
    ...data,
  };

  try {
    const mainOffice = await prisma.branchOffice.findFirst({
      where: { isActive: true },
    });

    if (mainOffice) {
      await prisma.branchOffice.update({
        where: { id: mainOffice.id },
        data: {
          name: data.name || mainOffice.name,
          code: data.code || mainOffice.code,
          address: data.address || mainOffice.address,
          phone: data.phone || mainOffice.phone,
          email: data.email || mainOffice.email,
          npwp: data.npwp || mainOffice.npwp,
        },
      });
    } else if (data.name && data.code) {
      await prisma.branchOffice.create({
        data: {
          name: data.name,
          code: data.code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          npwp: data.npwp,
        },
      });
    }
  } catch (error) {
    console.error("Error updating branch office info:", error);
  }

  return globalCompanySettingsStore;
}
