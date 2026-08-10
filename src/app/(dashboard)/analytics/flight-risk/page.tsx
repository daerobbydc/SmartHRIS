"use me";
"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Users,
  ShieldAlert,
  CheckCircle2,
  BrainCircuit,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Clock,
  Briefcase,
  Award,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

interface TurnoverPrediction {
  employeeId: string;
  name: string;
  position: string;
  department: string;
  riskScore: number;
  riskLevel: "Tinggi" | "Sedang" | "Rendah";
  factors: string[];
  recommendation: string;
}

export default function FlightRiskDashboardPage() {
  const [predictions, setPredictions] = useState<TurnoverPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedEmp, setSelectedEmp] = useState<TurnoverPrediction | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.turnoverPrediction) {
          setPredictions(data.turnoverPrediction);
        }
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filter predictions
  const filtered = predictions.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchLevel = selectedLevel === "ALL" || emp.riskLevel === selectedLevel;
    const matchDept = selectedDept === "ALL" || emp.department === selectedDept;
    return matchSearch && matchLevel && matchDept;
  });

  // Calculate high/medium/low counts
  const highRiskCount = predictions.filter((p) => p.riskLevel === "Tinggi").length;
  const mediumRiskCount = predictions.filter((p) => p.riskLevel === "Sedang").length;
  const lowRiskCount = predictions.filter((p) => p.riskLevel === "Rendah").length;
  const totalCount = predictions.length || 1;

  // Pie chart data
  const pieData = [
    { name: "Risiko Tinggi", value: highRiskCount, color: "#ef4444" },
    { name: "Risiko Sedang", value: mediumRiskCount, color: "#f59e0b" },
    { name: "Risiko Rendah", value: lowRiskCount, color: "#10b981" },
  ];

  // Department breakdown data
  const depts = Array.from(new Set(predictions.map((p) => p.department)));
  const deptBarData = depts.map((dept) => {
    const deptItems = predictions.filter((p) => p.department === dept);
    const avgScore = Math.round(
      deptItems.reduce((acc, curr) => acc + curr.riskScore, 0) / deptItems.length
    );
    return {
      department: dept,
      avgRiskScore: avgScore,
      highCount: deptItems.filter((p) => p.riskLevel === "Tinggi").length,
    };
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Predictive Flight Risk & Attrition Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" /> AI Powered
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deteksi dini potensi *turnover* karyawan berdasarkan pola keterlambatan, beban lembur, OKR, dan masa kerja.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Analisis AI
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Karyawan Dianalisis
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {predictions.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Aktif terpantau sistem AI</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Risiko Tinggi (Critical)
            </span>
            <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/50 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-red-700 dark:text-red-400">
            {highRiskCount} <span className="text-sm font-normal text-slate-500">({Math.round((highRiskCount / totalCount) * 100)}%)</span>
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">Memerlukan Stay Interview segera</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Risiko Sedang (Watchlist)
            </span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-700 dark:text-amber-400">
            {mediumRiskCount} <span className="text-sm font-normal text-slate-500">({Math.round((mediumRiskCount / totalCount) * 100)}%)</span>
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Perlu monitoring Supervisor</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Risiko Rendah (Stabil)
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {lowRiskCount} <span className="text-sm font-normal text-slate-500">({Math.round((lowRiskCount / totalCount) * 100)}%)</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Indikator kinerja & komitmen tinggi</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Distribusi Tingkat Risiko Attrition
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Proporsi tingkat kerentanan turnover seluruh karyawan perusahaan.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Rata-rata Skor Risiko per Departemen
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Departemen dengan indeks kecenderungan turnover tertinggi.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBarData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgRiskScore" name="Rata-rata Skor Risiko" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan, posisi, atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Risiko</option>
            <option value="Tinggi">Risiko Tinggi</option>
            <option value="Sedang">Risiko Sedang</option>
            <option value="Rendah">Risiko Rendah</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Departemen</option>
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Daftar Prediksi Attrition Karyawan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Klik kandidat untuk melihat analisis rinci faktor pemicu & saran interaksi HR.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-500 mb-2" />
            Memuat analisis AI...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Tidak ditemukan karyawan yang sesuai kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Nama Karyawan</th>
                  <th className="px-6 py-3">Jabatan & Dept</th>
                  <th className="px-6 py-3">Skor Risiko</th>
                  <th className="px-6 py-3">Tingkat Risiko</th>
                  <th className="px-6 py-3">Faktor Pemicu Kunci</th>
                  <th className="px-6 py-3 text-right">Aksi HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr
                    key={item.employeeId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => setSelectedEmp(item)}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <div>{item.position}</div>
                      <div className="text-xs text-slate-400">{item.department}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-16 rounded-full bg-slate-200 h-2.5 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              item.riskScore >= 65
                                ? "bg-red-500"
                                : item.riskScore >= 35
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${item.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs">{item.riskScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.riskLevel === "Tinggi"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : item.riskLevel === "Sedang"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {item.riskLevel === "Tinggi" && <AlertTriangle className="h-3 w-3" />}
                        {item.riskLevel === "Sedang" && <TrendingDown className="h-3 w-3" />}
                        {item.riskLevel === "Rendah" && <CheckCircle2 className="h-3 w-3" />}
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.factors.slice(0, 2).map((f, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {f}
                          </span>
                        ))}
                        {item.factors.length > 2 && (
                          <span className="text-xs text-slate-400">+{item.factors.length - 2} lagi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmp(item);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                      >
                        Detail & Rekomendasi <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Analisis Attrition: {selectedEmp.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedEmp.position} • {selectedEmp.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Skor Risiko Attrition
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      selectedEmp.riskScore >= 65
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : selectedEmp.riskScore >= 35
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {selectedEmp.riskScore}% ({selectedEmp.riskLevel})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Faktor Pemicu Risiko Terdeteksi:
                </h4>
                <ul className="space-y-1.5">
                  {selectedEmp.factors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/50 dark:bg-teal-950/30">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-semibold text-sm">
                  <BrainCircuit className="h-4 w-4" /> Rekomendasi Tindakan HR:
                </div>
                <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedEmp.recommendation}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEmp(null)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
              >
                Tutup & Catat Tindakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
