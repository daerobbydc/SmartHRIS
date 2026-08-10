import { prisma } from "@/lib/prisma";

export interface CreateBusinessTripInput {
  employeeId: string;
  title: string;
  destination: string;
  purpose: string;
  startDate: Date;
  endDate: Date;
  estimatedBudget: number;
  cashAdvanceAmount: number;
}

export interface SubmitSettlementInput {
  businessTripId: string;
  employeeId: string;
  totalReceipts: number;
  advanceAmount: number;
  receiptUrls?: string;
  notes?: string;
}

/**
 * Create a business trip request
 */
export async function createBusinessTrip(input: CreateBusinessTripInput) {
  return await prisma.businessTrip.create({
    data: {
      employeeId: input.employeeId,
      title: input.title,
      destination: input.destination,
      purpose: input.purpose,
      startDate: input.startDate,
      endDate: input.endDate,
      estimatedBudget: input.estimatedBudget,
      cashAdvanceAmount: input.cashAdvanceAmount,
      status: "PENDING",
    },
    include: {
      employee: { select: { firstName: true, lastName: true, department: true, position: true } },
    },
  });
}

/**
 * Approve or reject a business trip
 */
export async function approveBusinessTrip(
  tripId: string,
  managerUserId: string,
  approved: boolean,
  rejectionReason?: string
) {
  return await prisma.businessTrip.update({
    where: { id: tripId },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      approvedBy: managerUserId,
      rejectionReason: approved ? null : rejectionReason,
    },
  });
}

/**
 * Submit cash advance settlement for a completed business trip
 */
export async function submitSettlement(input: SubmitSettlementInput) {
  const trip = await prisma.businessTrip.findUnique({
    where: { id: input.businessTripId },
  });

  if (!trip) {
    throw new Error("Perjalanan dinas tidak ditemukan");
  }

  // Calculate difference: positive = reimbursement (reception > advance), negative = refund to company
  const differenceAmount = input.totalReceipts - input.advanceAmount;

  return await prisma.$transaction(async (tx) => {
    const settlement = await tx.cashAdvanceSettlement.create({
      data: {
        businessTripId: input.businessTripId,
        employeeId: input.employeeId,
        totalReceipts: input.totalReceipts,
        advanceAmount: input.advanceAmount,
        differenceAmount,
        receiptUrls: input.receiptUrls,
        notes: input.notes,
        status: "PENDING",
      },
    });

    // Mark trip as SETTLED once settlement is submitted
    await tx.businessTrip.update({
      where: { id: input.businessTripId },
      data: { status: "SETTLED" },
    });

    return settlement;
  });
}

/**
 * Approve or reject settlement claim
 */
export async function approveSettlement(
  settlementId: string,
  managerUserId: string,
  approved: boolean
) {
  return await prisma.cashAdvanceSettlement.update({
    where: { id: settlementId },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      approvedBy: managerUserId,
    },
  });
}
