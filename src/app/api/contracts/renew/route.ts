import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST - Renew contract
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { contractId, newEndDate, newSalary } = await req.json();

    const existingContract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return NextResponse.json({ error: "Kontrak tidak ditemukan" }, { status: 404 });
    }

    // Mark old contract as renewed
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: "RENEWED" },
    });

    // Create new contract
    const newContract = await prisma.contract.create({
      data: {
        employeeId: existingContract.employeeId,
        contractType: existingContract.contractType,
        startDate: existingContract.endDate,
        endDate: new Date(newEndDate),
        position: existingContract.position,
        salary: newSalary || existingContract.salary,
        renewalCount: existingContract.renewalCount + 1,
      },
    });

    return NextResponse.json(newContract);
  } catch (error) {
    console.error("Renew contract error:", error);
    return NextResponse.json({ error: "Gagal memperpanjang kontrak" }, { status: 500 });
  }
}
