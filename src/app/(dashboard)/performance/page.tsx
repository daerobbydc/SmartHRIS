"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  TrendingUp,
  Award,
  BarChart3,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn, getStatusLabel, getOKRTypeLabel } from "@/lib/utils";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  AnimatedBadge,
  TableContainer,
  EmptyState,
  LoadingSpinner,
  Modal,
} from "@/components/ui";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { usePermissions } from "@/hooks/use-permissions";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  score: number | null;
  maxScore: number;
  period: string;
  year: number;
  status: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  };
}

interface OKR {
  id: string;
  title: string;
  description: string | null;
  type: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  period: string;
  year: number;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

export default function PerformancePage() {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR" || role === "MANAGER";
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assessments" | "okr">("assessments");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    weight: "",
    maxScore: "100",
    period: "MONTHLY",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    assessedBy: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [assessRes, okrRes] = await Promise.all([
      fetch("/api/performance"),
      fetch("/api/performance/okr"),
    ]);

    if (assessRes.ok) {
      const data = await assessRes.json();
      setAssessments(data);
    }

    if (okrRes.ok) {
      const data = await okrRes.json();
      setOkrs(data);
    }

    setLoading(false);
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        employeeId: session?.user?.id || "",
      }),
    });

    setShowModal(false);
    fetchData();
  };

  const handleScore = async (id: string, score: number) => {
    await fetch(`/api/performance?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, status: "COMPLETED" }),
    });
    fetchData();
  };

  const getScoreColor = (score: number | null, maxScore: number) => {
    if (score === null) return "text-gray-400";
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getProgressColor = (current: number | null, target: number | null) => {
    if (!current || !target) return "bg-gray-200";
    const percentage = (current / target) * 100;
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Calculate stats
  const completedAssessments = assessments.filter((a) => a.status === "COMPLETED");
  const avgScore =
    completedAssessments.length > 0
      ? completedAssessments.reduce((sum, a) => sum + Number(a.score || 0), 0) /
        completedAssessments.length
      : 0;

  const assessmentColumns = [
    {
      key: "employee",
      header: "Karyawan",
      render: (item: Assessment) => (
        <div>
          <p className="font-semibold text-gray-900">
            {item.employee.firstName} {item.employee.lastName}
          </p>
          <p className="text-xs text-gray-500">{item.employee.department}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Penilaian",
      render: (item: Assessment) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "weight",
      header: "Bobot",
      render: (item: Assessment) => (
        <span className="text-sm font-medium text-gray-700">{item.weight}%</span>
      ),
    },
    {
      key: "score",
      header: "Skor",
      render: (item: Assessment) => (
        <span
          className={cn("text-lg font-bold", getScoreColor(item.score, item.maxScore))}
        >
          {item.score !== null ? `${item.score}/${item.maxScore}` : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Assessment) => (
        <AnimatedBadge
          variant={
            item.status === "COMPLETED"
              ? "success"
              : item.status === "PENDING"
                ? "warning"
                : "default"
          }
        >
          {getStatusLabel(item.status)}
        </AnimatedBadge>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item: Assessment) =>
        item.status === "PENDING" && (
          <input
            type="number"
            className="w-24 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Skor"
            min="0"
            max={item.maxScore}
            onBlur={(e) => {
              const score = parseFloat(e.target.value);
              if (!isNaN(score)) {
                handleScore(item.id, score);
              }
            }}
          />
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Performance Management"
        description="Kelola penilaian kinerja dan OKR karyawan secara komprehensif"
        action={
          canManage ? (
            <ModernButton variant="primary" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Tambah Penilaian
            </ModernButton>
          ) : undefined
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
         <StatCard
          title="Total Penilaian"
          value={assessments.length.toString()}
          icon={<Target className="h-5 w-5" />}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Rata-rata Skor"
          value={avgScore.toFixed(1)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
          trend={{
            value: avgScore >= 70 ? 10 : 5,
            isPositive: avgScore >= 70,
          }}
        />
        <StatCard
          title="OKR Aktif"
          value={okrs.length.toString()}
          icon={<Award className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Selesai"
          value={completedAssessments.length.toString()}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="yellow"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit"
      >
        <ModernButton
          variant={activeTab === "assessments" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("assessments")}
        >
          <BarChart3 className="h-4 w-4" />
          Penilaian Tugas
        </ModernButton>
        <ModernButton
          variant={activeTab === "okr" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("okr")}
        >
          <Activity className="h-4 w-4" />
          OKR
        </ModernButton>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "assessments" ? (
          <motion.div
            key="assessments"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {assessments.length === 0 ? (
              <EmptyState
                icon={<Target className="h-12 w-12" />}
                title="Belum ada penilaian"
                description="Mulai tambahkan penilaian kinerja untuk karyawan Anda"
                action={
                  canManage ? (
                    <ModernButton variant="primary" onClick={() => setShowModal(true)}>
                      <Plus className="h-4 w-4" />
                      Tambah Penilaian
                    </ModernButton>
                  ) : undefined
                }
              />
            ) : (
              <TableContainer>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penilaian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bobot</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Input Skor</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assessments.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-gray-900">{item.employee.firstName} {item.employee.lastName}</p>
                            <p className="text-xs text-gray-500">{item.employee.department}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          {item.description && <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">{item.weight}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("text-lg font-bold", getScoreColor(item.score, item.maxScore))}>
                            {item.score !== null ? `${item.score}/${item.maxScore}` : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AnimatedBadge
                            variant={
                              item.status === "COMPLETED"
                                ? "success"
                                : item.status === "PENDING"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {getStatusLabel(item.status)}
                          </AnimatedBadge>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {item.status === "PENDING" && (
                              <input
                                type="number"
                                className="w-24 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Skor"
                                min="0"
                                max={item.maxScore}
                                onBlur={(e) => {
                                  const score = parseFloat(e.target.value);
                                  if (!isNaN(score)) {
                                    handleScore(item.id, score);
                                  }
                                }}
                              />
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableContainer>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="okr"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {okrs.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="Belum ada OKR"
                description="Tetapkan objekatif dan key result untuk karyawan Anda"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {okrs.map((okr, index) => (
                  <motion.div
                    key={okr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {okr.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {okr.employee.firstName} {okr.employee.lastName}
                          </p>
                        </div>
                        <AnimatedBadge
                          variant={okr.type === "OBJECTIVE" ? "info" : "info"}
                        >
                          {getOKRTypeLabel(okr.type)}
                        </AnimatedBadge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {okr.period} {okr.year}
                        </span>
                      </div>

                      {okr.targetValue && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {okr.currentValue || 0} / {okr.targetValue} {okr.unit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  ((okr.currentValue || 0) / okr.targetValue) * 100,
                                  100
                                )}%`,
                              }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn(
                                "h-2.5 rounded-full",
                                getProgressColor(okr.currentValue, okr.targetValue)
                              )}
                            />
                          </div>
                          <p className="text-xs text-gray-500 text-right">
                            {Math.round(
                              ((okr.currentValue || 0) / okr.targetValue) * 100
                            )}
                            % selesai
                          </p>
                        </div>
                      )}

                      {!okr.targetValue && (
                        <AnimatedBadge variant="default">
                          {getStatusLabel(okr.status)}
                        </AnimatedBadge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Penilaian"
      >
        <form onSubmit={handleSubmitAssessment} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Penilaian
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Masukkan judul penilaian"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              placeholder="Deskripsikan penilaian"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bobot (%)
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="0-100"
                min="0"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode
              </label>
              <AutocompleteSelect
                options={[
                  { value: "MONTHLY", label: "Bulanan (Monthly)", sublabel: "Evaluasi kinerja setiap bulan" },
                  { value: "QUARTERLY", label: "Quarterly (Triwulan)", sublabel: "Evaluasi Q1 - Q4" },
                  { value: "YEARLY", label: "Tahunan (Annual)", sublabel: "Penilaian akhir tahun" },
                ]}
                value={formData.period}
                onChange={(val) => setFormData({ ...formData, period: val })}
                placeholder="-- Pilih Periode --"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <ModernButton
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Batal
            </ModernButton>
            <ModernButton type="submit" variant="primary">
              Simpan Penilaian
            </ModernButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
