import { prisma } from "@/lib/prisma";

const p = prisma as any;

// ==================== PUBLIC HOLIDAY CALENDAR ====================

export interface HolidayInfo {
  id: string;
  name: string;
  date: Date;
  type: string;
  year: number;
}

/**
 * Get all holidays for a year
 */
export async function getHolidays(year: number): Promise<HolidayInfo[]> {
  const holidays = await p.publicHoliday.findMany({
    where: { year, isActive: true },
    orderBy: { date: "asc" },
  });

  return holidays;
}

/**
 * Get holidays for a specific month
 */
export async function getMonthHolidays(year: number, month: number): Promise<HolidayInfo[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const holidays = await p.publicHoliday.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      isActive: true,
    },
    orderBy: { date: "asc" },
  });

  return holidays;
}

/**
 * Check if a date is a holiday
 */
export async function isHoliday(date: Date): Promise<boolean> {
  const holiday = await p.publicHoliday.findFirst({
    where: {
      date: date,
      isActive: true,
    },
  });

  return !!holiday;
}

/**
 * Get next holiday from a date
 */
export async function getNextHoliday(fromDate: Date): Promise<HolidayInfo | null> {
  const holiday = await p.publicHoliday.findFirst({
    where: {
      date: { gt: fromDate },
      isActive: true,
    },
    orderBy: { date: "asc" },
  });

  return holiday;
}

/**
 * Add a holiday
 */
export async function addHoliday(
  name: string,
  date: Date,
  type: string
): Promise<HolidayInfo> {
  const year = date.getFullYear();

  return p.publicHoliday.create({
    data: {
      name,
      date,
      type: type as "NATIONAL" | "RELIGIOUS" | "COLLECTIVE",
      year,
    },
  });
}

/**
 * Add multiple holidays (bulk import)
 */
export async function addHolidays(
  holidays: { name: string; date: Date; type: string }[]
): Promise<number> {
  let count = 0;

  for (const h of holidays) {
    try {
      await addHoliday(h.name, h.date, h.type);
      count++;
    } catch (error) {
      // Skip duplicates
      console.log(`Skip duplicate: ${h.name}`);
    }
  }

  return count;
}

/**
 * Delete a holiday
 */
export async function deleteHoliday(id: string): Promise<boolean> {
  try {
    await p.publicHoliday.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Indonesian public holidays for a year (predefined)
 */
export function getIndonesianHolidays(year: number): { name: string; date: Date; type: string }[] {
  return [
    // Fixed holidays
    { name: "Tahun Baru Masehi", date: new Date(year, 0, 1), type: "NATIONAL" },
    { name: "Hari Buruh Internasional", date: new Date(year, 4, 1), type: "NATIONAL" },
    { name: "Hari Kebangkitan Nasional", date: new Date(year, 4, 20), type: "NATIONAL" },
    { name: "Hari Pancasila", date: new Date(year, 5, 1), type: "NATIONAL" },
    { name: "Hari Jatuhnya Proklamasi Kemerdekaan RI", date: new Date(year, 7, 17), type: "NATIONAL" },
    { name: "Hari Sumpah Pemuda", date: new Date(year, 9, 28), type: "NATIONAL" },
    { name: "Hari Pahlawan", date: new Date(year, 10, 10), type: "NATIONAL" },
    { name: "Hari Jadi TNI", date: new Date(year, 9, 5), type: "NATIONAL" },
    { name: "Hari Guru Nasional", date: new Date(year, 10, 25), type: "NATIONAL" },
    { name: "Hari Nusantara", date: new Date(year, 11, 13), type: "NATIONAL" },
    { name: "Hari Raya Natal", date: new Date(year, 11, 25), type: "RELIGIOUS" },

    // Islamic holidays (approximate - needs annual update)
    { name: "Isra Mi'raj Nabi Muhammad SAW", date: new Date(year, 1, 27), type: "RELIGIOUS" },
    { name: "Tahun Baru Islam 1446 H", date: new Date(year, 6, 7), type: "RELIGIOUS" },
    { name: "Hari Raya Idul Fitri 1446 H", date: new Date(year, 2, 30), type: "RELIGIOUS" },
    { name: "Hari Raya Idul Adha 1446 H", date: new Date(year, 5, 6), type: "RELIGIOUS" },
    { name: "Hari Maulid Nabi Muhammad SAW", date: new Date(year, 8, 5), type: "RELIGIOUS" },

    // Chinese holidays
    { name: "Tahun Baru Imlek", date: new Date(year, 0, 29), type: "RELIGIOUS" },

    // Hindu holidays
    { name: "Hari Raya Nyepi", date: new Date(year, 2, 11), type: "RELIGIOUS" },

    // Buddhist holidays
    { name: "Hari Raya Waisak", date: new Date(year, 4, 12), type: "RELIGIOUS" },

    // Collective holidays (Cuti Bersama)
    { name: "Cuti Bersama Idul Fitri 1", date: new Date(year, 2, 31), type: "COLLECTIVE" },
    { name: "Cuti Bersama Idul Fitri 2", date: new Date(year, 3, 1), type: "COLLECTIVE" },
    { name: "Cuti Bersama Idul Fitri 3", date: new Date(year, 3, 2), type: "COLLECTIVE" },
    { name: "Cuti Bersama Idul Fitri 4", date: new Date(year, 3, 3), type: "COLLECTIVE" },
    { name: "Cuti Bersama Natal", date: new Date(year, 11, 26), type: "COLLECTIVE" },
  ];
}
