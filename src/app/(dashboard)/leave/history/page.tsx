"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Check, X, Upload, Clock, CheckCircle2, FileText, Filter, AlertCircle } from "lucide-react";
import { formatDate, getStatusLabel, getLeaveTypeLabel } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ImportModal } from "@/components/import-modal";
import { usePermissions } from "@/hooks/use-permissions";

interface Leave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  employee: { employeeId: string; firstName: string; lastName: string; department: string };
}

export default function LeaveHistoryPage() {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const canManageLeave = role === "ADMIN" || role === "HR" || role === "MANAGER";

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/leave${params}`);
    if (res.ok) {
      setLeaves(await res.json());
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/leave?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", approvedBy: session?.user?.name || "" }),
    });
    fetchLeaves();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/leave?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    fetchLeaves();
  };

  const getDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

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
              Riwayat Cuti & Persetujuan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Calendar className="h-3.5 w-3.5" /> Manajemen Cuti
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daftar pengajuan izin dan cuti kerja karyawan beserta alur persetujuan HR/Manager.
          </p>
        </div>

        {canManageLeave && (
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 transition"
          >
            <Upload className="h-4 w-4 text-teal-600" /> Import Data Cuti
          </button>
        )}
      </div>

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={fetchLeaves}
        type="leave"
        title="Import Data Cuti Karyawan"
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase tracking-wider">
            <span>Menunggu Persetujuan</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {pendingCount} <span className="text-xs font-normal text-slate-400">Pengajuan</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600">
            {approvedCount} <span className="text-xs font-normal text-slate-400">Disetujui</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase tracking-wider">
            <span>Ditolak</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {rejectedCount} <span className="text-xs font-normal text-slate-400">Ditolak</span>
          </p>
        </div>
      </div>

      {/* Status Filter */}
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" /> Riwayat Cuti
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3.5">Karyawan</th>
                <th className="px-6 py-3.5">Tipe Cuti</th>
                <th className="px-6 py-3.5">Tanggal Pelaksanaan</th>
                <th className="px-6 py-3.5">Durasi</th>
                <th className="px-6 py-3.5">Status</th>
                {canManageLeave && (
                  <th className="px-6 py-3.5 text-right">Aksi Persetujuan</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Memuat riwayat cuti...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Belum ada pengajuan cuti yang tercatat.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      <div>
                        {l.employee.firstName} {l.employee.lastName}
                      </div>
                      <div className="text-[11px] font-normal text-slate-400">
                        {l.employee.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-600 dark:text-teal-400">
                      {getLeaveTypeLabel(l.type)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(l.startDate)} — {formatDate(l.endDate)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {getDays(l.startDate, l.endDate)} Hari
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                          l.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : l.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {getStatusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageLeave && l.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(l.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                          >
                            <Check className="h-3.5 w-3.5" /> Setujui
                          </button>
                          <button
                            onClick={() => handleReject(l.id)}
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
    </motion.div>
  );
}
