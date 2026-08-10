"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X, Clock, Filter, Calendar, Users, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Overtime {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  };
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
}

export default function OvertimePage() {
  const [overtime, setOvertime] = useState<Overtime[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    hours: "",
    reason: "",
  });

  useEffect(() => {
    fetchOvertime();
    fetchEmployees();
  }, [statusFilter]);

  const fetchOvertime = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/absensi/overtime?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOvertime(data);
      }
    } catch (error) {
      console.error("Error fetching overtime:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Auto calculate duration in hours if start and end times are set
  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    const newForm = { ...formData, [field]: value };
    if (newForm.startTime && newForm.endTime) {
      const start = new Date(newForm.startTime).getTime();
      const end = new Date(newForm.endTime).getTime();
      if (end > start) {
        const diffHours = (end - start) / (1000 * 60 * 60);
        newForm.hours = diffHours.toFixed(1);
      }
    }
    setFormData(newForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return;

    await fetch("/api/absensi/overtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setShowModal(false);
    resetForm();
    fetchOvertime();
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/absensi/overtime?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    fetchOvertime();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/absensi/overtime?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    fetchOvertime();
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      hours: "",
      reason: "",
    });
  };

  const pendingCount = overtime.filter((o) => o.status === "PENDING").length;
  const approvedCount = overtime.filter((o) => o.status === "APPROVED").length;
  const totalHours = overtime
    .filter((o) => o.status === "APPROVED")
    .reduce((sum, o) => sum + Number(o.hours), 0);

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
              Manajemen Kerja Lembur (Overtime)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Absensi & Roster
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola pengajuan jam lembur, perhitungan kompensasi, dan alur persetujuan Supervisor/HR.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" /> Ajukan Lembur Baru
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase tracking-wider">
            <span>Menunggu Persetujuan</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {pendingCount} <span className="text-xs font-normal text-slate-400">Permohonan</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Total Jam Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600">
            {totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">Jam Kerja</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Pengajuan Disetujui</span>
            <FileText className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {approvedCount} <span className="text-xs font-normal text-slate-400">Formulir</span>
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui (Approved)</option>
            <option value="REJECTED">Ditolak (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Overtime Requests Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daftar Riwayat Kerja Lembur
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3.5">Karyawan</th>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5">Rentang Waktu</th>
                <th className="px-6 py-3.5">Durasi</th>
                <th className="px-6 py-3.5">Keterangan / Tugas</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Memuat data lembur...
                  </td>
                </tr>
              ) : overtime.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Belum ada pengajuan lembur yang tercatat.
                  </td>
                </tr>
              ) : (
                overtime.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>
                        {item.employee.firstName} {item.employee.lastName}
                      </div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {item.employee.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 font-mono text-[11px]">
                      {new Date(item.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(item.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-600 dark:text-teal-400">
                      {item.hours} Jam
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{item.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                          >
                            <Check className="h-3.5 w-3.5" /> Setujui
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition"
                          >
                            <X className="h-3.5 w-3.5" /> Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Overtime Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Formulir Pengajuan Lembur
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Isi detail jam kerja lembur dan alasan pekerjaan.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-teal-600" /> Karyawan
                </label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: emp.department || "Staff",
                  }))}
                  value={formData.employeeId}
                  onChange={(val) => setFormData({ ...formData, employeeId: val })}
                  placeholder="-- Cari Karyawan --"
                  searchPlaceholder="Ketik nama karyawan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Lembur
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Mulai
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleTimeChange("startTime", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Selesai
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleTimeChange("endTime", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Durasi Lembur (Jam)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Contoh: 3.5"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Alasan Pekerjaan Lembur
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Tuliskan detail pekerjaan lembur..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  Simpan & Ajukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
