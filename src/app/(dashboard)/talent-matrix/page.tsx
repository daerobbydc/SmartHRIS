"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  Star,
  Users,
  Award,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface MatrixEntry {
  id: string;
  employeeId: string;
  performanceRating: number;
  potentialRating: number;
  boxNumber: number;
  boxCategory: string;
  notes: string | null;
  employee: Employee;
}

const BOX_LABELS: Record<number, { title: string; subtitle: string; bg: string; text: string }> = {
  9: { title: "Box 9: Star / Top Talent", subtitle: "High Perf, High Pot", bg: "bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-300" },
  8: { title: "Box 8: High Performer", subtitle: "High Perf, Med Pot", bg: "bg-teal-100 border-teal-300 dark:bg-teal-950/40", text: "text-teal-800 dark:text-teal-300" },
  7: { title: "Box 7: Solid Professional", subtitle: "High Perf, Low Pot", bg: "bg-cyan-100 border-cyan-300 dark:bg-cyan-950/40", text: "text-cyan-800 dark:text-cyan-300" },
  6: { title: "Box 6: High Potential", subtitle: "Med Perf, High Pot", bg: "bg-teal-50 border-teal-200 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  5: { title: "Box 5: Core Player", subtitle: "Med Perf, Med Pot", bg: "bg-slate-100 border-slate-300 dark:bg-slate-800/50", text: "text-slate-800 dark:text-slate-200" },
  4: { title: "Box 4: Effective Specialist", subtitle: "Med Perf, Low Pot", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/30", text: "text-slate-700 dark:text-slate-300" },
  3: { title: "Box 3: Enigma / Dilemma", subtitle: "Low Perf, High Pot", bg: "bg-amber-100 border-amber-300 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-300" },
  2: { title: "Box 2: Dilemma", subtitle: "Low Perf, Med Pot", bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  1: { title: "Box 1: Underperformer", subtitle: "Low Perf, Low Pot", bg: "bg-red-100 border-red-300 dark:bg-red-950/40", text: "text-red-800 dark:text-red-300" },
};

export default function TalentMatrixPage() {
  const [entries, setEntries] = useState<MatrixEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    performanceRating: 2,
    potentialRating: 2,
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMatrix, resEmps] = await Promise.all([
        fetch("/api/talent-matrix"),
        fetch("/api/employees"),
      ]);

      if (resMatrix.ok) {
        const data = await resMatrix.json();
        setEntries(data.entries || []);
      }
      if (resEmps.ok) {
        const dataEmps = await resEmps.json();
        setEmployees(dataEmps.employees || dataEmps || []);
      }
    } catch (err) {
      console.error("Failed to load talent matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/talent-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ employeeId: "", performanceRating: 2, potentialRating: 2, notes: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Save rating error:", err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              9-Box Grid Talent Matrix
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Grid className="h-3.5 w-3.5" /> Succession Planning
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pemetaan matriks 9 kotak (Kinerja vs Potensi) untuk identifikasi *Top Performers* & suksesi promosi jabatan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> Evaluasi Matriks Talent
          </button>
        </div>
      </div>

      {/* 3x3 Grid Display */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Matriks 9-Box Grid (Kinerja Y-Axis vs Potensi X-Axis)
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
            Memuat peta 9-Box Grid...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((boxNum) => {
              const info = BOX_LABELS[boxNum];
              const boxEmps = entries.filter((e) => e.boxNumber === boxNum);

              return (
                <div
                  key={boxNum}
                  className={`min-h-[140px] rounded-xl border p-4 transition ${info.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${info.text}`}>{info.title}</span>
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {boxEmps.length} Orang
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{info.subtitle}</p>

                  <div className="mt-3 space-y-1">
                    {boxEmps.map((item) => (
                      <div
                        key={item.id}
                        className="rounded bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                      >
                        {item.employee.firstName} {item.employee.lastName}
                        <div className="text-[10px] text-slate-400 font-normal">{item.employee.position}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Rating */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Evaluasi Rating 9-Box Grid
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Penilaian performa vs potensi karyawan untuk suksesi karir.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRating} className="mt-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-teal-600" /> Karyawan yang Dievaluasi
                </label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: `${emp.department} • ${emp.position}`,
                  }))}
                  value={form.employeeId}
                  onChange={(val) => setForm({ ...form, employeeId: val })}
                  placeholder="-- Cari Karyawan --"
                  searchPlaceholder="Ketik nama karyawan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-600" /> Rating Kinerja (Performance: 1 - 3)
                </label>
                <select
                  value={form.performanceRating}
                  onChange={(e) => setForm({ ...form, performanceRating: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                >
                  <option value={3}>3 - High (Sangat Tinggi / Exceeds Target)</option>
                  <option value={2}>2 - Medium (Sedang / Meets Target)</option>
                  <option value={1}>1 - Low (Rendah / Below Target)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Rating Potensi (Potential: 1 - 3)
                </label>
                <select
                  value={form.potentialRating}
                  onChange={(e) => setForm({ ...form, potentialRating: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                >
                  <option value={3}>3 - High (Potensi Pemimpin Strategis)</option>
                  <option value={2}>2 - Medium (Potensi Pengembangan Spesialis)</option>
                  <option value={1}>1 - Low (Potensi Terbatas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Evaluasi HR / Supervisor
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan rekomendasi suksesi & pelatihan..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition-all"
                >
                  Simpan Matriks Talent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

