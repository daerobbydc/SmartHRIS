import { prisma } from "@/lib/prisma";

// ==================== SMART ATTENDANCE ====================

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
}

export interface AttendancePattern {
  employeeId: string;
  name: string;
  avgCheckIn: string;
  avgCheckOut: string;
  lateFrequency: number;
  earlyLeaveFrequency: number;
  overtimeFrequency: number;
  pattern: "regular" | "irregular" | "early_bird" | "night_owl";
}

export interface SmartInsight {
  type: "pattern" | "anomaly" | "recommendation";
  title: string;
  description: string;
  employeeName?: string;
  confidence: number; // 0-100
}

// Office geofence (default: Jakarta office)
export const DEFAULT_GEOFENCE: GeofenceZone = {
  id: "office-hq",
  name: "Kantor Pusat SmartHRIS",
  latitude: -6.2088,
  longitude: 106.8456,
  radius: 100, // 100 meters
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if location is within geofence
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  zone: GeofenceZone = DEFAULT_GEOFENCE
): boolean {
  const distance = calculateDistance(userLat, userLon, zone.latitude, zone.longitude);
  return distance <= zone.radius;
}

/**
 * Analyze attendance patterns
 */
export async function analyzeAttendancePatterns(
  days: number = 30
): Promise<AttendancePattern[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: {
      attendance: {
        where: { date: { gte: startDate } },
        orderBy: { date: "desc" },
      },
    },
  });

  return employees
    .filter((emp) => emp.attendance.length > 0)
    .map((emp) => {
      const attendances = emp.attendance;

      // Calculate average check-in time
      const checkInTimes = attendances
        .filter((a) => a.checkIn)
        .map((a) => {
          const d = new Date(a.checkIn!);
          return d.getHours() * 60 + d.getMinutes();
        });

      const checkOutTimes = attendances
        .filter((a) => a.checkOut)
        .map((a) => {
          const d = new Date(a.checkOut!);
          return d.getHours() * 60 + d.getMinutes();
        });

      const avgCheckInMinutes =
        checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length || 480; // 8:00
      const avgCheckOutMinutes =
        checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length || 1020; // 17:00

      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      };

      const lateCount = attendances.filter((a) => a.status === "LATE").length;
      const absentCount = attendances.filter((a) => a.status === "ABSENT").length;

      // Determine pattern
      let pattern: AttendancePattern["pattern"] = "regular";
      if (avgCheckInMinutes < 450) pattern = "early_bird"; // Before 7:30
      else if (avgCheckInMinutes > 510) pattern = "night_owl"; // After 8:30
      else if (lateCount > days * 0.3) pattern = "irregular";

      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        avgCheckIn: formatTime(avgCheckInMinutes),
        avgCheckOut: formatTime(avgCheckOutMinutes),
        lateFrequency: lateCount,
        earlyLeaveFrequency: 0, // Calculate if needed
        overtimeFrequency: checkOutTimes.filter((t) => t > 1020).length,
        pattern,
      };
    })
    .sort((a, b) => b.lateFrequency - a.lateFrequency);
}

/**
 * Generate smart attendance insights
 */
export async function getSmartInsights(): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];
  const patterns = await analyzeAttendancePatterns();

  // Pattern-based insights
  const earlyBirds = patterns.filter((p) => p.pattern === "early_bird");
  if (earlyBirds.length > 0) {
    insights.push({
      type: "pattern",
      title: "Early Birds Detected",
      description: `${earlyBirds.length} karyawan memiliki pola check-in lebih awal dari biasanya`,
      confidence: 85,
    });
  }

  const irregulars = patterns.filter((p) => p.pattern === "irregular");
  if (irregulars.length > 0) {
    insights.push({
      type: "anomaly",
      title: "Irregular Attendance Patterns",
      description: `${irregulars.length} karyawan memiliki pola absensi tidak teratur`,
      confidence: 90,
    });
  }

  // Overtime analysis
  const frequentOvertime = patterns.filter((p) => p.overtimeFrequency > 10);
  if (frequentOvertime.length > 0) {
    insights.push({
      type: "recommendation",
      title: "Frequent Overtime Detected",
      description: `${frequentOvertime.length} karyawan sering lembur. Pertimbangkan untuk review workload`,
      confidence: 75,
    });
  }

  // Top late employees
  const topLate = patterns.slice(0, 3);
  topLate.forEach((emp) => {
    if (emp.lateFrequency > 5) {
      insights.push({
        type: "anomaly",
        title: "Frequent Late Arrival",
        description: `${emp.name} terlambat ${emp.lateFrequency} kali dalam 30 hari terakhir`,
        employeeName: emp.name,
        confidence: 95,
      });
    }
  });

  return insights.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Predict optimal shift schedule
 */
export async function predictOptimalSchedule(): Promise<{
  recommendations: { department: string; suggestedShift: string; reason: string }[];
}> {
  // Analyze department attendance patterns
  const departments = await prisma.employee.groupBy({
    by: ["department"],
    where: { status: "ACTIVE" },
  });

  const recommendations = [];

  for (const dept of departments) {
    const employees = await prisma.employee.findMany({
      where: { department: dept.department, status: "ACTIVE" },
      include: {
        attendance: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
      },
    });

    // Analyze peak hours
    const checkInHours = employees
      .flatMap((e) => e.attendance.filter((a) => a.checkIn).map((a) => new Date(a.checkIn!).getHours()))
      .filter((h) => h >= 6 && h <= 10);

    const avgHour = checkInHours.reduce((a, b) => a + b, 0) / checkInHours.length || 8;

    let suggestedShift = "08:00-17:00";
    let reason = "Standard working hours";

    if (avgHour < 7.5) {
      suggestedShift = "07:00-16:00";
      reason = "Karyawan cenderung check-in lebih awal";
    } else if (avgHour > 8.5) {
      suggestedShift = "09:00-18:00";
      reason = "Karyawan cenderung check-in lebih lambat";
    }

    recommendations.push({
      department: dept.department,
      suggestedShift,
      reason,
    });
  }

  return { recommendations };
}
