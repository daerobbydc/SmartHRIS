"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Check, X, Clock, Filter } from "lucide-react";
import { formatDate, getStatusLabel, getSubmissionTypeLabel } from "@/lib/utils";
import {
  SectionHeader,
  ModernButton,
  AnimatedBadge,
  TableContainer,
  EmptyState,
  LoadingSpinner,
} from "@/components/ui";

interface Submission {
  id: string;
  type: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
  employee: { employeeId: string; firstName: string; lastName: string; department: string };
}

export default function ApprovalPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  useEffect(() => { fetchSubmissions(); }, [typeFilter, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/ess/submissions?${params}`);
    if (res.ok) { setSubmissions(await res.json()); }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/ess/submissions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED", approvedBy: session?.user?.name || "", approvedAt: new Date().toISOString() }),
    });
    fetchSubmissions();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Alasan penolakan:");
    if (reason === null) return;
    await fetch(`/api/ess/submissions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
    });
    fetchSubmissions();
  };

  const getStatusVariant = (status: string): "warning" | "success" | "danger" | "default" => {
    const map: Record<string, "warning" | "success" | "danger" | "default"> = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return map[status] || "default";
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Approval Pengajuan"
        description="Setujui atau tolak pengajuan karyawan"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
        >
          <option value="">Semua Tipe</option>
          <option value="LEAVE">Cuti</option>
          <option value="OVERTIME">Lembur</option>
          <option value="EXPENSE">Reimbursement</option>
          <option value="DOCUMENT">Dokumen</option>
          <option value="SCHEDULE_CHANGE">Ubah Jadwal</option>
          <option value="DATA_CHANGE">Ubah Data</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">Menunggu</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
        </select>
      </motion.div>

      <TableContainer>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Clock className="h-8 w-8" />}
                    title="Tidak ada pengajuan"
                    description="Tidak ada pengajuan yang sesuai dengan filter yang dipilih"
                  />
                </td>
              </tr>
            ) : submissions.map((s, i) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="hover:bg-gray-50/60 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{s.employee.firstName} {s.employee.lastName}</p>
                  <p className="text-sm text-gray-500">{s.employee.department}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{getSubmissionTypeLabel(s.type)}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  {s.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{s.description}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {s.startDate && formatDate(s.startDate)}
                  {s.startDate && s.endDate && " - "}
                  {s.endDate && formatDate(s.endDate)}
                </td>
                <td className="px-6 py-4">
                  <AnimatedBadge variant={getStatusVariant(s.status)} pulse={s.status === "PENDING"}>
                    {getStatusLabel(s.status)}
                  </AnimatedBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  {s.status === "PENDING" && (
                    <div className="flex items-center justify-end gap-1">
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(s.id)}
                        icon={<Check className="h-4 w-4 text-emerald-600" />}
                      >
                        <span className="sr-only">Setujui</span>
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(s.id)}
                        icon={<X className="h-4 w-4 text-rose-600" />}
                      >
                        <span className="sr-only">Tolak</span>
                      </ModernButton>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
