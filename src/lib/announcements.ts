import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ==================== ANNOUNCEMENT SYSTEM ====================

export interface AnnouncementInfo {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAll: boolean;
  targetDepts: string | null;
  targetRoles: string | null;
  publishAt: Date;
  expiresAt: Date | null;
  authorId: string;
  authorName: string;
  views: number;
  createdAt: Date;
}

/**
 * Get published announcements
 */
export async function getAnnouncements(
  limit?: number
): Promise<AnnouncementInfo[]> {
  const now = new Date();
  
  const announcements = await p.announcement.findMany({
    where: {
      isPublished: true,
      publishAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { publishAt: "desc" },
    ],
    take: limit,
  });

  return announcements;
}

/**
 * Get announcement by ID
 */
export async function getAnnouncementById(
  id: string
): Promise<AnnouncementInfo | null> {
  const announcement = await p.announcement.findUnique({
    where: { id },
  });

  if (!announcement) return null;

  // Increment views
  await p.announcement.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return announcement;
}

/**
 * Create announcement
 */
export async function createAnnouncement(
  data: Omit<AnnouncementInfo, "id" | "views" | "createdAt">
): Promise<AnnouncementInfo> {
  return p.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      targetAll: data.targetAll,
      targetDepts: data.targetDepts,
      targetRoles: data.targetRoles,
      publishAt: data.publishAt,
      expiresAt: data.expiresAt,
      authorId: data.authorId,
      authorName: data.authorName,
    },
  });
}

/**
 * Update announcement
 */
export async function updateAnnouncement(
  id: string,
  data: Partial<AnnouncementInfo>
): Promise<boolean> {
  try {
    await p.announcement.update({
      where: { id },
      data,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    await p.announcement.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ==================== NOTIFICATION SYSTEM ====================

export interface NotificationInfo {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Get user notifications
 */
export async function getNotifications(
  userId: string,
  limit: number = 20
): Promise<NotificationInfo[]> {
  const notifications = await p.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return p.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Create notification
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "INFO",
  link?: string
): Promise<NotificationInfo> {
  return p.notification.create({
    data: {
      userId,
      title,
      message,
      type: type as "INFO" | "WARNING" | "SUCCESS" | "ERROR",
      link,
    },
  });
}

/**
 * Create bulk notifications
 */
export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: string = "INFO",
  link?: string
): Promise<number> {
  const data = userIds.map((userId) => ({
    userId,
    title,
    message,
    type: type as "INFO" | "WARNING" | "SUCCESS" | "ERROR",
    link,
  }));

  const result = await p.notification.createMany({ data });
  return result.count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<boolean> {
  try {
    await p.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await p.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await p.notification.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send leave notification to managers
 */
export async function notifyLeaveRequest(
  employeeId: string,
  employeeName: string,
  leaveType: string
): Promise<void> {
  // Get managers by department
  const managers = await prisma.employee.findMany({
    where: { position: { contains: "Manager", mode: "insensitive" } },
    select: { userId: true },
  });

  for (const mgr of managers) {
    if (mgr.userId) {
      await createNotification(
        mgr.userId,
        "Pengajuan Cuti Baru",
        `${employeeName} mengajukan cuti ${leaveType}`,
        "INFO",
        "/ess/approval"
      );
    }
  }
}

/**
 * Send leave decision notification
 */
export async function notifyLeaveDecision(
  employeeId: string,
  status: string,
  leaveType: string
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, firstName: true },
  });

  if (employee) {
    await createNotification(
      employee.userId,
      `Cuti ${status === "APPROVED" ? "Disetujui" : "Ditolak"}`,
      `Pengajuan cuti ${leaveType} telah ${status === "APPROVED" ? "disetujui" : "ditolak"}`,
      status === "APPROVED" ? "SUCCESS" : "WARNING",
      "/leave/history"
    );
  }
}
