import { prisma } from "@/lib/prisma";

export interface CreateShiftSwapInput {
  requesterId: string;
  recipientId: string;
  requesterDate: Date;
  recipientDate: Date;
  reason?: string;
}

/**
 * Create a new shift swap request between colleagues
 */
export async function createShiftSwapRequest(input: CreateShiftSwapInput) {
  // Validate that both employees exist
  const [requester, recipient] = await Promise.all([
    prisma.employee.findUnique({ where: { id: input.requesterId } }),
    prisma.employee.findUnique({ where: { id: input.recipientId } }),
  ]);

  if (!requester || !recipient) {
    throw new Error("Karyawan pemohon atau penerima tidak ditemukan");
  }

  // Check if a request already exists for these dates
  const existing = await prisma.shiftSwapRequest.findFirst({
    where: {
      requesterId: input.requesterId,
      requesterDate: input.requesterDate,
      status: { in: ["PENDING_COLLEAGUE", "PENDING_MANAGER"] },
    },
  });

  if (existing) {
    throw new Error("Sudah ada pengajuan tukar shift aktif untuk tanggal ini");
  }

  return await prisma.shiftSwapRequest.create({
    data: {
      requesterId: input.requesterId,
      recipientId: input.recipientId,
      requesterDate: input.requesterDate,
      recipientDate: input.recipientDate,
      reason: input.reason,
      status: "PENDING_COLLEAGUE",
    },
    include: {
      requester: { select: { firstName: true, lastName: true, department: true } },
      recipient: { select: { firstName: true, lastName: true, department: true } },
    },
  });
}

/**
 * Colleague response to shift swap request (Approve/Reject)
 */
export async function respondByColleague(
  requestId: string,
  recipientId: string,
  accepted: boolean,
  note?: string
) {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: requestId },
  });

  if (!swapRequest) {
    throw new Error("Pengajuan tukar shift tidak ditemukan");
  }

  if (swapRequest.recipientId !== recipientId) {
    throw new Error("Anda tidak memiliki akses untuk menyetujui pengajuan ini");
  }

  if (swapRequest.status !== "PENDING_COLLEAGUE") {
    throw new Error("Pengajuan ini sudah diproses atau dibatalkan");
  }

  const newStatus = accepted ? "PENDING_MANAGER" : "REJECTED";

  return await prisma.shiftSwapRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      colleagueNote: note,
    },
  });
}

/**
 * Manager approval for shift swap request (Approve/Reject)
 * Upon Manager Approval, the actual EmployeeSchedule assignments are swapped.
 */
export async function respondByManager(
  requestId: string,
  managerUserId: string,
  approved: boolean,
  managerNote?: string
) {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: requestId },
  });

  if (!swapRequest) {
    throw new Error("Pengajuan tukar shift tidak ditemukan");
  }

  if (swapRequest.status !== "PENDING_MANAGER") {
    throw new Error("Pengajuan ini belum disetujui oleh rekan sejawat atau sudah selesai");
  }

  if (!approved) {
    return await prisma.shiftSwapRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedBy: managerUserId,
        managerNote,
      },
    });
  }

  // Transaction: Approve request & Swap EmployeeSchedule records
  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.shiftSwapRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedBy: managerUserId,
        managerNote,
      },
    });

    // Find schedule assignments
    const reqSchedule = await tx.employeeSchedule.findFirst({
      where: {
        employeeId: swapRequest.requesterId,
        startDate: swapRequest.requesterDate,
      },
    });

    const recSchedule = await tx.employeeSchedule.findFirst({
      where: {
        employeeId: swapRequest.recipientId,
        startDate: swapRequest.recipientDate,
      },
    });

    // If schedule entries exist, swap their scheduleId
    if (reqSchedule && recSchedule) {
      await tx.employeeSchedule.update({
        where: { id: reqSchedule.id },
        data: { scheduleId: recSchedule.scheduleId },
      });

      await tx.employeeSchedule.update({
        where: { id: recSchedule.id },
        data: { scheduleId: reqSchedule.scheduleId },
      });
    }

    return updatedRequest;
  });
}
