import { prisma } from "@/lib/prisma";

// ==================== AI ANALYTICS ====================

export interface TurnoverPrediction {
  employeeId: string;
  name: string;
  position: string;
  department: string;
  riskScore: number; // 0-100
  riskLevel: "Tinggi" | "Sedang" | "Rendah";
  factors: string[];
  recommendation: string;
}

export interface SalaryInsight {
  department: string;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  marketRate?: number;
  equity: "underpaid" | "fair" | "overpaid";
}

export interface AnomalyDetection {
  type: "attendance" | "payroll" | "leave";
  severity: "low" | "medium" | "high";
  description: string;
  employeeName?: string;
  date?: string;
}

export interface PredictiveAnalytics {
  headcountPrediction: { month: string; predicted: number; actual?: number }[];
  payrollForecast: { month: string; predicted: number }[];
  leaveTrend: { month: string; count: number }[];
}

/**
 * Prediksi risiko turnover / flight risk karyawan secara komprehensif
 */
export async function predictTurnover(): Promise<TurnoverPrediction[]> {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: {
      attendance: { orderBy: { date: "desc" }, take: 90 },
      leaves: { orderBy: { createdAt: "desc" }, take: 10 },
      overtime: { orderBy: { date: "desc" }, take: 10 },
      okrs: { orderBy: { createdAt: "desc" }, take: 5 },
      assessments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  return employees.map((emp) => {
    let riskScore = 0;
    const factors: string[] = [];

    // Factor 1: Late attendance frequency (Max 25 pts)
    const recentAttendances = emp.attendance.filter((a) => a.status === "LATE");
    if (recentAttendances.length > 8) {
      riskScore += 25;
      factors.push("Tingkat keterlambatan tinggi (> 8x)");
    } else if (recentAttendances.length > 4) {
      riskScore += 15;
      factors.push("Kadang terlambat (4-8x)");
    }

    // Factor 2: Absence rate (Max 20 pts)
    const absentDays = emp.attendance.filter((a) => a.status === "ABSENT").length;
    if (absentDays > 4) {
      riskScore += 20;
      factors.push("Ketidakhadiran tanpa keterangan tinggi");
    } else if (absentDays > 1) {
      riskScore += 10;
      factors.push("Pernah alpa / tidak presensi");
    }

    // Factor 3: Overtime overload / Burnout risk (Max 20 pts)
    const totalOvertimeHours = emp.overtime.reduce((sum, ot) => sum + Number(ot.hours || 0), 0);
    if (totalOvertimeHours > 30) {
      riskScore += 20;
      factors.push("Jam lembur sangat tinggi (> 30 jam) - Risiko Burnout");
    } else if (totalOvertimeHours > 15) {
      riskScore += 10;
      factors.push("Jam lembur di atas rata-rata (> 15 jam)");
    }

    // Factor 4: Tenure (High risk for new joins < 6m and plateaued employees 3-5y) (Max 20 pts)
    const tenureMonths = Math.floor(
      (Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (tenureMonths < 6) {
      riskScore += 20;
      factors.push("Karyawan baru masa adaptasi (< 6 bulan)");
    } else if (tenureMonths >= 36 && tenureMonths <= 60) {
      riskScore += 15;
      factors.push("Masa kerja 3-5 tahun (Fase jenjang karir)");
    }

    // Factor 5: Performance / OKR progress drop (Max 15 pts)
    const lowOkrs = emp.okrs.filter((okr) => {
      const current = Number(okr.currentValue || 0);
      const target = Number(okr.targetValue || 100);
      return target > 0 && current / target < 0.5;
    });
    if (lowOkrs.length > 0) {
      riskScore += 15;
      factors.push("Progress OKR/Target di bawah 50%");
    }

    // Determine Risk Level & Recommendation
    const finalScore = Math.min(100, riskScore);
    let riskLevel: TurnoverPrediction["riskLevel"] = "Rendah";
    let recommendation = "Pertahankan kondisi kerja dan berikan apresiasi secara rutin.";

    if (finalScore >= 65) {
      riskLevel = "Tinggi";
      recommendation = "Lakukan 1-on-1 Stay Interview segera, tinjau beban kerja/lembur, dan diskusikan peluang jenjang karir.";
    } else if (finalScore >= 35) {
      riskLevel = "Sedang";
      recommendation = "Jadwalkan check-in bulanan dengan Supervisor dan berikan penyesuaian fleksibilitas kerja.";
    }

    return {
      employeeId: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      department: emp.department,
      riskScore: finalScore,
      riskLevel,
      factors: factors.length > 0 ? factors : ["Kondisi presensi dan performa stabil"],
      recommendation,
    };
  })
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Deteksi anomali dalam data
 */
export async function detectAnomalies(): Promise<AnomalyDetection[]> {
  const anomalies: AnomalyDetection[] = [];

  // Check attendance anomalies
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendance = await prisma.attendance.findMany({
    where: { date: today },
    include: { employee: true },
  });

  // Late arrivals after 10:00
  todayAttendance
    .filter((a) => {
      if (!a.checkIn) return false;
      const hour = new Date(a.checkIn).getHours();
      return hour >= 10;
    })
    .forEach((a) => {
      anomalies.push({
        type: "attendance",
        severity: "medium",
        description: `Check-in sangat terlambat (${new Date(a.checkIn!).toLocaleTimeString("id-ID")})`,
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
        date: today.toISOString(),
      });
    });

  // Check payroll anomalies
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const payrollData = await prisma.payroll.findMany({
    where: { month: currentMonth, year: currentYear },
    include: { employee: true },
  });

  // Detect unusual salary variations
  const avgSalary =
    payrollData.reduce((sum, p) => sum + Number(p.baseSalary), 0) / payrollData.length || 0;

  payrollData
    .filter((p) => {
      const deviation = Math.abs(Number(p.baseSalary) - avgSalary) / avgSalary;
      return deviation > 0.5; // 50% deviation
    })
    .forEach((p) => {
      anomalies.push({
        type: "payroll",
        severity: "high",
        description: `Gaji tidak wajar (${Number(p.baseSalary) > avgSalary ? "terlalu tinggi" : "terlalu rendah"})`,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      });
    });

  // Check leave anomalies
  const employeesWithLongLeaves = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    include: {
      leaves: {
        where: {
          status: "APPROVED",
          startDate: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      },
    },
  });

  employeesWithLongLeaves
    .filter((emp) => emp.leaves.length > 3)
    .forEach((emp) => {
      anomalies.push({
        type: "leave",
        severity: "low",
        description: `Mengambil ${emp.leaves.length} cuti dalam bulan ini`,
        employeeName: `${emp.firstName} ${emp.lastName}`,
      });
    });

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Generate predictive analytics
 */
export async function getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
  const now = new Date();
  const months = [];

  // Get last 6 months data
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const employeeCount = await prisma.employee.count({
      where: {
        status: "ACTIVE",
        hireDate: { lte: date },
      },
    });

    const payrollSum = await prisma.payroll.aggregate({
      where: { month, year },
      _sum: { netSalary: true },
    });

    const leaveCount = await prisma.leave.count({
      where: {
        startDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    months.push({
      date: `${year}-${month.toString().padStart(2, "0")}`,
      employeeCount,
      payrollTotal: Number(payrollSum._sum.netSalary) || 0,
      leaveCount,
    });
  }

  // Simple linear regression for prediction
  const predictLinear = (data: number[]) => {
    const n = data.length;
    const sumX = data.reduce((acc, _, i) => acc + i, 0);
    const sumY = data.reduce((acc, y) => acc + y, 0);
    const sumXY = data.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = data.reduce((acc, _, i) => acc + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return (x: number) => slope * x + intercept;
  };

  const employeeCounts = months.map((m) => m.employeeCount);
  const payrollTotals = months.map((m) => m.payrollTotal);
  const leaveCounts = months.map((m) => m.leaveCount);

  const predictEmployee = predictLinear(employeeCounts);
  const predictPayroll = predictLinear(payrollTotals);

  // Predict next 3 months
  const headcountPrediction = [];
  const payrollForecast = [];

  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStr = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, "0")}`;

    headcountPrediction.push({
      month: monthStr,
      predicted: Math.round(predictEmployee(months.length + i - 1)),
    });

    payrollForecast.push({
      month: monthStr,
      predicted: Math.round(predictPayroll(months.length + i - 1)),
    });
  }

  return {
    headcountPrediction,
    payrollForecast,
    leaveTrend: months.map((m) => ({ month: m.date, count: m.leaveCount })),
  };
}

/**
 * Salary equity analysis
 */
export async function analyzeSalaryEquity(): Promise<SalaryInsight[]> {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { department: true, salary: true },
  });

  const departmentMap = new Map<string, number[]>();

  employees.forEach((emp) => {
    const current = departmentMap.get(emp.department) || [];
    current.push(Number(emp.salary));
    departmentMap.set(emp.department, current);
  });

  const insights: SalaryInsight[] = [];

  departmentMap.forEach((salaries, department) => {
    const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);

    // Simple equity determination
    let equity: "underpaid" | "fair" | "overpaid" = "fair";
    if (avg < 5_000_000) equity = "underpaid";
    else if (avg > 20_000_000) equity = "overpaid";

    insights.push({
      department,
      avgSalary: Math.round(avg),
      minSalary: min,
      maxSalary: max,
      equity,
    });
  });

  return insights.sort((a, b) => b.avgSalary - a.avgSalary);
}
