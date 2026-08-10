"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, FileText, Clock, Check, X, FileCheck, Calendar } from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { formatDate, getStatusLabel, getSubmissionTypeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  AnimatedBadge,
  EmptyState,
  LoadingSpinner,
  Modal,
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
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  };
}

export default function ESSPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [formData, setFormData] = useState({
    type: "LEAVE",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, typeFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    const res = await fetch(`/api/ess/submissions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/ess/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        employeeId: session?.user?.id || "",
      }),
    });

    setShowModal(false);
    resetForm();
    fetchSubmissions();
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/ess/submissions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
      }),
    });
    fetchSubmissions();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Alasan penolakan:");
    if (reason === null) return;

    await fetch(`/api/ess/submissions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "REJECTED",
        rejectionReason: reason,
      }),
    });
    fetchSubmissions();
  };

  const resetForm = () => {
    setFormData({
      type: "LEAVE",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      LEAVE: "📅",
      OVERTIME: "⏰",
      EXPENSE: "💰",
      DOCUMENT: "📄",
      SCHEDULE_CHANGE: "🔄",
      DATA_CHANGE: "✏️",
      COMPLAINT: "⚠️",
      SUGGESTION: "💡",
    };
    return icons[type] || "📝";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Employee Self Service"
        description="Ajukan pengajuan dan kelola persetujuan"
        action={
          <ModernButton variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Buat Pengajuan
          </ModernButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatCard
          title="Menunggu"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          color="yellow"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Disetujui"
          value={approvedCount}
          icon={<Check className="h-5 w-5 text-green-600" />}
          color="green"
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Total Pengajuan"
          value={submissions.length}
          icon={<FileText className="h-5 w-5 text-teal-600" />}
          color="blue"
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
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
            className="px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12 text-gray-400" />}
            title="Belum ada pengajuan"
            description="Buat pengajuan baru untuk memulai"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {submissions.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {item.title}
                          </h3>
                           <AnimatedBadge
                            variant={item.status === "PENDING" ? "warning" : item.status === "APPROVED" ? "success" : "danger"}
                          >
                            {item.status}
                          </AnimatedBadge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {getSubmissionTypeLabel(item.type)} •{" "}
                          {item.employee.firstName} {item.employee.lastName} •{" "}
                          {item.employee.department}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {item.description}
                          </p>
                        )}
                        {(item.startDate || item.endDate) && (
                          <p className="text-sm text-gray-500 mt-2">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            {item.startDate && formatDate(item.startDate)}
                            {item.startDate && item.endDate && " - "}
                            {item.endDate && formatDate(item.endDate)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Diajukan: {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    {item.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(item.id)}
                          className="text-green-600 hover:bg-green-50"
                          title="Setujui"
                        >
                          <Check className="h-4 w-4" />
                        </ModernButton>
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(item.id)}
                          className="text-red-600 hover:bg-red-50"
                          title="Tolak"
                        >
                          <X className="h-4 w-4" />
                        </ModernButton>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Buat Pengajuan Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Pengajuan
            </label>
            <AutocompleteSelect
              options={[
                { value: "LEAVE", label: "Cuti / Izin Kerja", sublabel: "Pengajuan izin tidak masuk" },
                { value: "OVERTIME", label: "Kerja Lembur", sublabel: "Klaim jam lembur tambahan" },
                { value: "EXPENSE", label: "Reimbursement / Biaya", sublabel: "Klaim pengeluaran operasional" },
                { value: "DOCUMENT", label: "Permohonan Dokumen", sublabel: "Surat / Sertifikat HR" },
                { value: "SCHEDULE_CHANGE", label: "Perubahan Jadwal Shift", sublabel: "Penyesuaian jadwal" },
                { value: "DATA_CHANGE", label: "Perubahan Data Diri", sublabel: "Update info rekening/alamat" },
                { value: "COMPLAINT", label: "Keluhan / Feedback", sublabel: "Laporan kendala" },
                { value: "SUGGESTION", label: "Saran & Masukan", sublabel: "Inovasi perusahaan" },
              ]}
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val })}
              placeholder="-- Pilih Tipe Pengajuan --"
              searchPlaceholder="Cari jenis pengajuan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
              placeholder="Contoh: Pengajuan Cuti Tahunan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
              rows={3}
              placeholder="Jelaskan pengajuan Anda..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <ModernButton
              variant="ghost"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Batal
            </ModernButton>
            <ModernButton variant="primary" type="submit">
              Ajukan
            </ModernButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
