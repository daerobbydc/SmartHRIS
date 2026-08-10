import { prisma } from "@/lib/prisma";

// ==================== BIRTHDAY & ANNIVERSARY ALERTS ====================

export interface EmployeeCelebration {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  type: "birthday" | "anniversary";
  date: Date;
  daysUntil: number;
  yearsAtCompany?: number;
  message: string;
}

/**
 * Get upcoming birthdays (within 30 days)
 */
export async function getUpcomingBirthdays(daysAhead: number = 30): Promise<EmployeeCelebration[]> {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      dateOfBirth: { not: null },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: true,
      position: true,
      dateOfBirth: true,
    },
  });

  const celebrations: EmployeeCelebration[] = [];

  employees.forEach((emp) => {
    if (!emp.dateOfBirth) return;

    const dob = new Date(emp.dateOfBirth);
    const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    // If birthday already passed this year, use next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      const age = thisYearBirthday.getFullYear() - dob.getFullYear();
      celebrations.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        position: emp.position,
        type: "birthday",
        date: thisYearBirthday,
        daysUntil,
        message: `🎂 ${emp.firstName} akan berulang tahun ke-${age} dalam ${daysUntil} hari!`,
      });
    }
  });

  return celebrations.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get upcoming work anniversaries (within 30 days)
 */
export async function getUpcomingAnniversaries(daysAhead: number = 30): Promise<EmployeeCelebration[]> {
  const today = new Date();
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: true,
      position: true,
      hireDate: true,
    },
  });

  const celebrations: EmployeeCelebration[] = [];

  employees.forEach((emp) => {
    const hireDate = new Date(emp.hireDate);
    const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
    
    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(today.getFullYear() + 1);
    }

    const daysUntil = Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const yearsAtCompany = today.getFullYear() - hireDate.getFullYear();

    if (daysUntil >= 0 && daysUntil <= daysAhead && yearsAtCompany > 0) {
      let message = "";
      if (yearsAtCompany === 1) {
        message = `🎉 ${emp.firstName} merayakan 1 tahun bersama SmartHRIS!`;
      } else if (yearsAtCompany === 5) {
        message = `🏆 ${emp.firstName} telah 5 tahun bersama SmartHRIS!`;
      } else if (yearsAtCompany === 10) {
        message = `🥇 ${emp.firstName} telah 10 tahun bersama SmartHRIS!`;
      } else {
        message = `🎉 ${emp.firstName} merayakan ${yearsAtCompany} tahun bersama SmartHRIS!`;
      }

      celebrations.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        position: emp.position,
        type: "anniversary",
        date: thisYearAnniversary,
        daysUntil,
        yearsAtCompany,
        message,
      });
    }
  });

  return celebrations.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get all upcoming celebrations
 */
export async function getAllCelebrations(daysAhead: number = 30): Promise<{
  birthdays: EmployeeCelebration[];
  anniversaries: EmployeeCelebration[];
  total: number;
}> {
  const [birthdays, anniversaries] = await Promise.all([
    getUpcomingBirthdays(daysAhead),
    getUpcomingAnniversaries(daysAhead),
  ]);

  return {
    birthdays,
    anniversaries,
    total: birthdays.length + anniversaries.length,
  };
}

/**
 * Get today's celebrations
 */
export async function getTodaysCelebrations(): Promise<EmployeeCelebration[]> {
  const allCelebrations = await getAllCelebrations(1);
  return [...allCelebrations.birthdays, ...allCelebrations.anniversaries];
}

/**
 * Send celebration notification (placeholder for email/slack integration)
 */
export async function sendCelebrationNotification(
  celebration: EmployeeCelebration,
  channel: "email" | "slack" | "teams" = "email"
): Promise<boolean> {
  // In production, this would send actual notifications
  console.log(`[${channel.toUpperCase()}] Sending celebration notification:`, celebration.message);
  return true;
}
