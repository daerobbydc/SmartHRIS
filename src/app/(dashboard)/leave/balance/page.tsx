"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Settings,
  Sparkles,
  Users,
  Award,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { usePermissions } from "@/hooks/use-permissions";

interface LeaveBalance {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  leaveType: string;
  entitled: number;
  used: number;
  pending: number;
  carriedOver: number;
  remaining: number;
}

interface LeavePolicy {
  id: string;
  name: string;
  leaveType: string;
  daysPerYear: number;
  maxCarryOver: number;
  minServiceMonths: number;
  gender: string;
  isActive: boolean;
}

export default function LeaveBalancePage() {
  const { role } = usePermissions();
  const canManageLeave = role === "ADMIN" || role === "HR";

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState("all");
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [showInitializeDialog, setShowInitializeDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);

  const [policyForm, setPolicyForm] = useState({
    name: "",
    leaveType: "ANNUAL",
    daysPerYear: 12,
    maxCarryOver: 6,
    minServiceMonths: 0,
    gender: "ALL",
  });

  const [initForm, setInitForm] = useState({
    leaveType: "ANNUAL",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchBalances();
    fetchPolicies();
  }, [selectedYear]);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave-balance?action=summary&year=${selectedYear}`);
      const data = await res.json();
      setBalances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`/api/leave-balance?action=policies`);
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching policies:", error);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPolicy
        ? `/api/leave-balance?id=${editingPolicy.id}`
        : "/api/leave-balance";
      const method = editingPolicy ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "policy", ...policyForm }),
      });

      setShowPolicyDialog(false);
      resetPolicyForm();
      fetchPolicies();
    } catch (error) {
      console.error("Error saving policy:", error);
    }
  };

  const handleInitializeBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/leave-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize", ...initForm }),
      });

      setShowInitializeDialog(false);
      fetchBalances();
    } catch (error) {
      console.error("Error initializing balances:", error);
    }
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      name: "",
      leaveType: "ANNUAL",
      daysPerYear: 12,
      maxCarryOver: 6,
      minServiceMonths: 0,
      gender: "ALL",
    });
    setEditingPolicy(null);
  };

  const editPolicy = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      leaveType: policy.leaveType,
      daysPerYear: policy.daysPerYear,
      maxCarryOver: policy.maxCarryOver,
      minServiceMonths: policy.minServiceMonths,
      gender: policy.gender,
    });
    setShowPolicyDialog(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Hapus kebijakan cuti ini?")) return;
    try {
      await fetch(`/api/leave-balance?id=${id}`, { method: "DELETE" });
      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
    }
  };

  const filteredBalances = balances.filter((b) => {
    if (selectedType !== "all" && b.leaveType !== selectedType) return false;
    return true;
  });

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANNUAL: "Cuti Tahunan",
      SICK: "Cuti Sakit",
      MATERNITY: "Cuti Melahirkan",
      PATERNITY: "Cuti Ayah",
      MARRIAGE: "Cuti Menikah",
      BEREAVEMENT: "Cuti Duka",
      UNPAID: "Cuti Tanpa Gaji",
    };
    return labels[type] || type;
  };

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
              Saldo Cuti & Kebijakan Hak Cuti
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Calendar className="h-3.5 w-3.5" /> Saldo Karyawan
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor jatah kuota cuti tahunan karyawan dan kelola peraturan kebijakan cuti perusahaan.
          </p>
        </div>

        {canManageLeave && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInitializeDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 transition"
            >
              <Clock className="h-4 w-4 text-teal-600" /> Inisialisasi Saldo
            </button>
            <button
              onClick={() => {
                resetPolicyForm();
                setShowPolicyDialog(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" /> Tambah Kebijakan Cuti
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipe Cuti:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">Semua Tipe Cuti</option>
            <option value="ANNUAL">Cuti Tahunan</option>
            <option value="SICK">Cuti Sakit</option>
            <option value="MATERNITY">Cuti Melahirkan</option>
            <option value="PATERNITY">Cuti Ayah</option>
            <option value="MARRIAGE">Cuti Menikah</option>
            <option value="BEREAVEMENT">Cuti Duka</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Tahun Fiskal:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Balances Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" /> Saldo Cuti Karyawan Tahun {selectedYear}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3.5">Nama Karyawan</th>
                <th className="px-6 py-3.5">Tipe Cuti</th>
                <th className="px-6 py-3.5">Hak Cuti</th>
                <th className="px-6 py-3.5">Terpakai</th>
                <th className="px-6 py-3.5">Menunggu</th>
                <th className="px-6 py-3.5">Sisa Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Memuat saldo cuti...
                  </td>
                </tr>
              ) : filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Belum ada data saldo cuti untuk tahun {selectedYear}. Klik <strong>Inisialisasi Saldo</strong> di atas.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {b.employeeName}
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-600 dark:text-teal-400">
                      {getLeaveTypeLabel(b.leaveType)}
                    </td>
                    <td className="px-6 py-4 font-semibold">{b.entitled} Hari</td>
                    <td className="px-6 py-4 font-semibold text-amber-600">{b.used} Hari</td>
                    <td className="px-6 py-4 font-semibold text-slate-400">{b.pending} Hari</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {b.remaining} Hari Tersisa
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Policies Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-teal-600" /> Matriks Kebijakan Cuti Perusahaan
            </h2>
            <p className="text-xs text-slate-400">
              Ketentuan hak kuota per tahun, carry over, dan syarat masa kerja.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {policies.map((pol) => (
            <div
              key={pol.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 hover:border-teal-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {getLeaveTypeLabel(pol.leaveType)}
                  </span>
                  {canManageLeave && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editPolicy(pol)}
                        className="text-slate-400 hover:text-teal-600"
                        title="Edit Kebijakan Cuti"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(pol.id)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Hapus Kebijakan Cuti"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                  {pol.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Kuota: <strong>{pol.daysPerYear} Hari / Tahun</strong> • Max Carry Over: <strong>{pol.maxCarryOver} Hari</strong>
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Min Masa Kerja: {pol.minServiceMonths} Bulan</span>
                <span>Gender: {pol.gender}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Modal */}
      {showPolicyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingPolicy ? "Edit Kebijakan Cuti" : "Tambah Kebijakan Cuti"}
              </h3>
              <button onClick={() => setShowPolicyDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kebijakan
                </label>
                <input
                  type="text"
                  required
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  placeholder="Contoh: Cuti Tahunan Reguler"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Cuti
                </label>
                <AutocompleteSelect
                  options={[
                    { value: "ANNUAL", label: "Cuti Tahunan", sublabel: "Jatah cuti rutin" },
                    { value: "SICK", label: "Cuti Sakit", sublabel: "Izin kesehatan" },
                    { value: "MATERNITY", label: "Cuti Melahirkan", sublabel: "Karyawati" },
                    { value: "PATERNITY", label: "Cuti Ayah", sublabel: "Karyawan istri melahirkan" },
                    { value: "MARRIAGE", label: "Cuti Menikah", sublabel: "Pernikahan" },
                    { value: "BEREAVEMENT", label: "Cuti Duka", sublabel: "Keluarga meninggal" },
                  ]}
                  value={policyForm.leaveType}
                  onChange={(val) => setPolicyForm({ ...policyForm, leaveType: val })}
                  placeholder="-- Pilih Tipe Cuti --"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kuota (Hari / Tahun)
                  </label>
                  <input
                    type="number"
                    required
                    value={policyForm.daysPerYear}
                    onChange={(e) => setPolicyForm({ ...policyForm, daysPerYear: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Carry Over
                  </label>
                  <input
                    type="number"
                    required
                    value={policyForm.maxCarryOver}
                    onChange={(e) => setPolicyForm({ ...policyForm, maxCarryOver: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPolicyDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  Simpan Kebijakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Initialize Modal */}
      {showInitializeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Inisialisasi Saldo Cuti Massal
              </h3>
              <button onClick={() => setShowInitializeDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleInitializeBalances} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Cuti yang Diinisialisasi
                </label>
                <AutocompleteSelect
                  options={[
                    { value: "ANNUAL", label: "Cuti Tahunan", sublabel: "Inisialisasi kuota 12 hari" },
                    { value: "SICK", label: "Cuti Sakit", sublabel: "Inisialisasi kuota sakit" },
                  ]}
                  value={initForm.leaveType}
                  onChange={(val) => setInitForm({ ...initForm, leaveType: val })}
                  placeholder="-- Pilih Tipe Cuti --"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Fiskal
                </label>
                <input
                  type="number"
                  required
                  value={initForm.year}
                  onChange={(e) => setInitForm({ ...initForm, year: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInitializeDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  Proses Inisialisasi Massal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
