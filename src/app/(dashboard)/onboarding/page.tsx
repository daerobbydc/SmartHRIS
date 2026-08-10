"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Check,
  Search,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Award,
  Layers,
  FileCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string | null;
}

interface OnboardingProgress {
  employeeId: string;
  employeeName: string;
  hireDate: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  byCategory: Record<string, { total: number; completed: number }>;
}

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [type, setType] = useState<"onboarding" | "offboarding">("onboarding");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInitDialog, setShowInitDialog] = useState(false);
  const [initType, setInitType] = useState("RESIGNATION");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchChecklist();
      fetchProgress();
    }
  }, [selectedEmployee, type]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      const emps = data.employees || data || [];
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmployee) {
        setSelectedEmployee(emps[0].id);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/onboarding?employeeId=${selectedEmployee}&type=${type}`
      );
      const data = await res.json();
      setChecklist(data.checklist || []);
    } catch (error) {
      console.error("Error fetching checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await fetch(
        `/api/onboarding?employeeId=${selectedEmployee}&type=progress`
      );
      const data = await res.json();
      setProgress(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const handleInitializeOnboarding = async () => {
    if (!selectedEmployee) return;
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initialize-onboarding",
          employeeId: selectedEmployee,
        }),
      });
      fetchChecklist();
      fetchProgress();
    } catch (error) {
      console.error("Error initializing onboarding:", error);
    }
  };

  const handleInitializeOffboarding = async () => {
    if (!selectedEmployee) return;
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initialize-offboarding",
          employeeId: selectedEmployee,
          type: initType,
        }),
      });
      setShowInitDialog(false);
      fetchChecklist();
      fetchProgress();
    } catch (error) {
      console.error("Error initializing offboarding:", error);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          itemId,
          checklistType: type,
        }),
      });
      fetchChecklist();
      fetchProgress();
    } catch (error) {
      console.error("Error completing item:", error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PRE_ARRIVAL: "Tahap 1: Sebelum Kedatangan",
      FIRST_DAY: "Tahap 2: Hari Pertama Working Day",
      FIRST_WEEK: "Tahap 3: Minggu Pertama Orientasi",
      FIRST_MONTH: "Tahap 4: Evaluasi Bulan Pertama",
      RESIGNATION: "Proses Resign Karyawan",
      TERMINATION: "Pemutusan Hubungan Kerja (PHK)",
      CLEARANCE: "Clearance Serah Terima Aset",
      EXIT_INTERVIEW: "Exit Interview & Paklaring",
    };
    return labels[category] || category;
  };

  const getCategoryBadgeClass = (category: string) => {
    const classes: Record<string, string> = {
      PRE_ARRIVAL: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300",
      FIRST_DAY: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
      FIRST_WEEK: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300",
      FIRST_MONTH: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
      RESIGNATION: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
      TERMINATION: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300",
      CLEARANCE: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200",
      EXIT_INTERVIEW: "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-900 dark:text-teal-200",
    };
    return classes[category] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const currentEmp = employees.find((e) => e.id === selectedEmployee);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Onboarding & Offboarding Karyawan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <UserPlus className="h-3.5 w-3.5" /> Lifecycle HR
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola checklist orientasi karyawan baru dan alur keluar transisi masa kerja (*Clearance*).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setType("onboarding")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              type === "onboarding"
                ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-teal-600/20"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Mode Onboarding
          </button>
          <button
            onClick={() => {
              setType("offboarding");
              setShowInitDialog(true);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              type === "offboarding"
                ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-600/20"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            }`}
          >
            <UserMinus className="h-4 w-4" /> Mode Offboarding
          </button>
        </div>
      </div>

      {/* Employee Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-teal-600" /> Pilih Karyawan yang Diproses
            </label>
            <AutocompleteSelect
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}`,
                sublabel: `${emp.department} • ${emp.position}`,
              }))}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="-- Cari Nama atau Departemen Karyawan --"
              searchPlaceholder="Ketik nama karyawan untuk mencari..."
            />
          </div>

          {currentEmp && (
            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3 dark:border-teal-900/40 dark:bg-teal-950/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {currentEmp.firstName[0]}
                {currentEmp.lastName[0]}
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {currentEmp.firstName} {currentEmp.lastName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentEmp.department} • NIK: {currentEmp.employeeId || "EMP-001"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      {progress && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Tugas</span>
              <FileCheck className="h-4 w-4 text-teal-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {progress.totalTasks} <span className="text-xs font-normal text-slate-400">Tugas</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Tugas Selesai</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600">
              {progress.completedTasks} <span className="text-xs font-normal text-slate-400">Selesai</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Persentase Kelulusan</span>
              <Award className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-teal-600">{progress.progress}%</p>
            <div className="w-full rounded-full bg-slate-100 h-2 mt-2 overflow-hidden dark:bg-slate-800">
              <div
                className="h-2 bg-gradient-to-r from-teal-500 to-teal-700 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi Inisialisasi</span>
            {checklist.length === 0 ? (
              <button
                onClick={
                  type === "onboarding"
                    ? handleInitializeOnboarding
                    : () => setShowInitDialog(true)
                }
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5" /> Inisialisasi Checklist
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
                <CheckCircle2 className="h-4 w-4" /> Checklist Aktif
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Checklist Section */}
      {selectedEmployee && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-600" />
                Checklist {type === "onboarding" ? "Orientasi Onboarding" : "Transisi Offboarding"}
              </h2>
              <p className="text-xs text-slate-500">
                {checklist.length === 0
                  ? "Belum ada checklist. Klik Inisialisasi untuk mengaktifkan alur tugas."
                  : `${progress?.completedTasks || 0} dari ${checklist.length} tugas selesai`}
              </p>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
                Memuat tugas checklist...
              </div>
            ) : checklist.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                Belum ada checklist aktif untuk karyawan ini. Klik <strong>Inisialisasi Checklist</strong> di atas.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedChecklist).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${getCategoryBadgeClass(category)}`}>
                        {getCategoryLabel(category)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {items.filter((i) => i.isCompleted).length} / {items.length} Selesai
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 rounded-xl overflow-hidden dark:border-slate-800">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                                item.isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {item.isCompleted && <Check className="h-3.5 w-3.5" />}
                            </div>
                            <span className={item.isCompleted ? "line-through text-slate-400" : "font-semibold text-slate-900 dark:text-white"}>
                              {item.task}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {item.completedAt && (
                              <span className="text-[11px] text-slate-400">
                                Selesai: {new Date(item.completedAt).toLocaleDateString("id-ID")}
                              </span>
                            )}

                            {!item.isCompleted && (
                              <button
                                onClick={() => handleCompleteItem(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 transition"
                              >
                                <Check className="h-3.5 w-3.5" /> Tandai Selesai
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offboarding Initialization Modal */}
      {showInitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Inisialisasi Offboarding
              </h3>
              <button onClick={() => setShowInitDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipe Alasan Offboarding
                </label>
                <select
                  value={initType}
                  onChange={(e) => setInitType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                >
                  <option value="RESIGNATION">Pengunduran Diri Sukarela (Resignation)</option>
                  <option value="TERMINATION">Pemutusan Hubungan Kerja (PHK / Termination)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowInitDialog(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInitializeOffboarding}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-rose-700 hover:to-rose-800 transition"
              >
                Inisialisasi Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
