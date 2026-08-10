"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Calendar,
  Sparkles,
  GraduationCap,
  Grid,
  ArrowRightLeft,
  Plane,
  MessageSquare,
  UserMinus,
  PieChart,
  ShieldCheck,
  Award,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { usePermissions } from "@/hooks/use-permissions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  totalPayroll: number;
  totalApplicants: number;
  shortlisted: number;
  rejected: number;
  applicationsData: { name: string; applications: number; shortlisted: number; rejected: number }[];
  recentJobs: { id: string; title: string; department: string; applicants: number; createdAt: string }[];
  activityFeed: { id: string; name: string; action: string; target: string; createdAt: string; status: string }[];
  meetings: { id: string; name: string; scheduledAt: string; interviewer: string; location: string | null }[];
  employeeMetrics?: {
    leaveBalanceRemaining: number;
    attendanceStatus: string;
    pendingSubmissionsCount: number;
    completedLmsCount: number;
  };
  announcements?: { id: string; title: string; content: string; priority: string; createdAt: string }[];
  employeeSubmissions?: { id: string; type: string; title: string; status: string; createdAt: string }[];
}

export default function DashboardPage() {
  const { role } = usePermissions();
  const isAdminOrHR = role === "ADMIN" || role === "HR";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((resData) => {
        if (isMounted) setData(resData);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const updateClock = () => {
      if (isMounted) {
        const now = new Date();
        setCurrentTime(
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-teal-600"
          />
          <span className="text-xs font-semibold text-slate-500">Memuat Dashboard SmartHRIS...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-slate-500">Gagal memuat data dashboard</div>;
  }

  const statCards = isAdminOrHR
    ? [
        {
          title: "Total Karyawan Aktif",
          value: (data?.totalEmployees ?? 0).toLocaleString("id-ID"),
          icon: Users,
          badge: "+4% Bulan Ini",
          gradient: "from-teal-600 to-teal-700",
        },
        {
          title: "Presensi Masuk Hari Ini",
          value: `${data?.presentToday ?? 0} Orang`,
          icon: CheckCircle,
          badge: "Kehadiran Staf",
          gradient: "from-emerald-600 to-teal-600",
        },
        {
          title: "Permohonan Cuti Pending",
          value: `${data?.pendingLeaves ?? 0} Pengajuan`,
          icon: Clock,
          badge: "Memerlukan Review",
          gradient: "from-amber-600 to-teal-600",
        },
        {
          title: "Total Pelamar Kerja AI",
          value: (data?.totalApplicants ?? 0).toLocaleString("id-ID"),
          icon: Briefcase,
          badge: `${data?.shortlisted ?? 0} Lolos AI Match`,
          gradient: "from-cyan-600 to-teal-700",
        },
      ]
    : [
        {
          title: "Sisa Saldo Cuti",
          value: `${data?.employeeMetrics?.leaveBalanceRemaining ?? 12} Hari`,
          icon: Calendar,
          badge: `Tahun ${new Date().getFullYear()}`,
          gradient: "from-teal-600 to-teal-700",
        },
        {
          title: "Status Jam Kerja Hari Ini",
          value: data?.employeeMetrics?.attendanceStatus ?? "Belum Presensi",
          icon: CheckCircle,
          badge: "Geofence Valid",
          gradient: "from-emerald-600 to-teal-600",
        },
        {
          title: "Pengajuan Saya Pending",
          value: `${data?.employeeMetrics?.pendingSubmissionsCount ?? 0} Pengajuan`,
          icon: Clock,
          badge: "Menunggu Approval",
          gradient: "from-amber-600 to-teal-600",
        },
        {
          title: "Modul LMS Selesai",
          value: `${data?.employeeMetrics?.completedLmsCount ?? 0} Modul`,
          icon: GraduationCap,
          badge: "Sertifikat Terbit",
          gradient: "from-cyan-600 to-teal-700",
        },
      ];

  const quickActions = [
    { title: "LMS Pelatihan Internal", href: "/lms", icon: GraduationCap, color: "bg-teal-500/10 text-teal-600" },
    { title: "Absensi & Geofence", href: "/absensi", icon: Clock, color: "bg-emerald-500/10 text-emerald-600" },
    { title: "Pengajuan ESS", href: "/ess", icon: Sparkles, color: "bg-cyan-500/10 text-cyan-600" },
    { title: "Riwayat Cuti", href: "/leave/history", icon: Calendar, color: "bg-amber-500/10 text-amber-600" },
    ...(isAdminOrHR
      ? [
          { title: "9-Box Talent Matrix", href: "/talent-matrix", icon: Grid, color: "bg-emerald-500/10 text-emerald-600" },
          { title: "Shift Swap & Roster", href: "/absensi/shift-swap", icon: ArrowRightLeft, color: "bg-cyan-500/10 text-cyan-600" },
          { title: "Perjalanan Dinas", href: "/business-trip", icon: Plane, color: "bg-amber-500/10 text-amber-600" },
          { title: "WhatsApp Console", href: "/notifications/whatsapp", icon: MessageSquare, color: "bg-teal-500/10 text-teal-600" },
          { title: "Predictive Risk AI", href: "/analytics/flight-risk", icon: PieChart, color: "bg-indigo-500/10 text-indigo-600" },
          { title: "Offboarding & Paklaring", href: "/offboarding", icon: UserMinus, color: "bg-rose-500/10 text-rose-600" },
          { title: "AI Candidate Match", href: "/rekrutmen/applicants", icon: Sparkles, color: "bg-teal-500/10 text-teal-600" },
        ]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Banner Welcome & Digital Clock */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 p-6 text-white shadow-xl shadow-teal-900/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Enterprise Smart HR Management
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl tracking-tight">
              Selamat Datang di Portal SmartHRIS
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-100 max-w-xl">
              Sistem manajemen SDM terintegrasi berbasis AI, modul *Workforce Management*, serta pelatihan LMS terotomatisasi.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex flex-col sm:items-end rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="text-xl font-black font-mono tracking-widest">{currentTime}</span>
            </div>

            {!isAdminOrHR && (
              <Link
                href="/absensi"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all"
              >
                <Clock className="h-4 w-4" /> Presensi Now (Check-In / Out)
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`rounded-xl bg-gradient-to-br ${card.gradient} p-2.5 text-white shadow-md shadow-teal-500/20`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {card.value}
                </span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {card.badge}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Access Tiles */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-teal-600" /> Akses Cepat Modul HRIS
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-center shadow-xs transition hover:border-teal-500 hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
              >
                <div className={`rounded-xl p-2.5 transition group-hover:scale-110 ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Section */}
      {isAdminOrHR ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recharts Analytics Bar */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Statistik Rekrutmen & Pelamar Kerja
                </h2>
                <p className="text-xs text-slate-500">Pipeline pelamar AI match score tinggi</p>
              </div>
              <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                Bulan Ini
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.applicationsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="applications" fill="#0d9488" radius={[6, 6, 0, 0]} name="Pelamar" />
                  <Bar dataKey="shortlisted" fill="#10b981" radius={[6, 6, 0, 0]} name="Lolos AI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" /> Log Aktivitas Terkini
            </h2>

            <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
              {data.activityFeed.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white">{act.name} </span>
                    <span className="text-slate-600 dark:text-slate-300">{act.action} </span>
                    <span className="font-semibold text-teal-600">{act.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Employee Announcements & Updates */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600" /> Pengumuman Perusahaan Terbaru
                </h2>
                <p className="text-xs text-slate-500">Informasi dan edaran resmi dari HR & Manajemen</p>
              </div>
              <Link href="/announcements" className="text-xs font-bold text-teal-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3">
              {data?.announcements && data.announcements.length > 0 ? (
                data.announcements.map((ann) => (
                  <div key={ann.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className={`font-bold px-2 py-0.5 rounded ${ann.priority === "URGENT" ? "text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300" : "text-teal-700 bg-teal-50 dark:bg-teal-950 dark:text-teal-300"}`}>
                        Pengumuman {ann.priority}
                      </span>
                      <span>{new Date(ann.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ann.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {ann.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">Belum ada pengumuman resmi perusahaan.</div>
              )}
            </div>
          </div>

          {/* Quick ESS Status & Calendar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" /> Status Pengajuan Saya
            </h2>

            <div className="space-y-3 text-xs">
              {data?.employeeSubmissions && data.employeeSubmissions.length > 0 ? (
                data.employeeSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{sub.title}</p>
                      <p className="text-slate-500">{new Date(sub.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      sub.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                      sub.status === "REJECTED" ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" :
                      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Belum ada pengajuan ESS recorded.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
