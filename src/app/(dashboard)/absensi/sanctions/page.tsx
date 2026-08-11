"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, AlertTriangle, Trash2, ShieldAlert, CheckCircle2, Lock, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  SectionHeader,
  ModernButton,
  AnimatedBadge,
  TableContainer,
  EmptyState,
  LoadingSpinner,
  Modal,
} from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/hooks/use-permissions";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Sanction {
  id: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string | null;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
}

export default function SanctionsPage() {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Check if role is authorized to manage (create/delete) sanctions
  const canManageSanctions = role === "ADMIN" || role === "HR" || role === "MANAGER";

  const [formData, setFormData] = useState({
    employeeId: "",
    type: "WARNING",
    description: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  useEffect(() => {
    fetchSanctions();
    fetchEmployees();
  }, []);

  const fetchSanctions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/absensi/sanctions");
      if (res.ok) {
        setSanctions(await res.json());
      }
    } catch (error) {
      console.error("Error fetching sanctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleDownloadSP = async (sanctionId: string) => {
    try {
      const res = await fetch(`/api/export-pdf?type=sp&id=${sanctionId}`);
      if (!res.ok) {
        alert("Gagal mengunduh Surat Peringatan PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat_Peringatan_${sanctionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("SP PDF Error:", err);
      alert("Terjadi kesalahan saat mengunduh Surat Peringatan PDF");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSanctions) {
      alert("Akses ditolak: Karyawan biasa tidak dapat menambahkan sanksi.");
      return;
    }

    try {
      const res = await fetch("/api/absensi/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, createdBy: session?.user?.name || "" }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          employeeId: "",
          type: "WARNING",
          description: "",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: "",
        });
        fetchSanctions();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat sanksi presensi");
      }
    } catch (error) {
      console.error("Error creating sanction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageSanctions) {
      alert("Akses ditolak: Karyawan biasa tidak dapat menghapus sanksi.");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus sanksi ini?")) return;

    try {
      const res = await fetch(`/api/absensi/sanctions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSanctions();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus sanksi");
      }
    } catch (error) {
      console.error("Error deleting sanction:", error);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "warning" | "danger" | "info" | "default"> = {
      WARNING: "warning",
      FINAL_WARNING: "danger",
      SUSPENSION: "danger",
      DEMOTION: "info",
    };
    return variants[type] || ("default" as const);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <SectionHeader
        title="Sanksi Presensi & Indisipliner"
        description="Pencatatan sanksi indisipliner, surat peringatan (SP), dan suspensi karyawan"
        action={
          canManageSanctions ? (
            <ModernButton
              variant="danger"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowModal(true)}
            >
              Tambah Sanksi Presensi
            </ModernButton>
          ) : undefined
        }
      />

      <TableContainer>
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3.5 text-left">Tipe Sanksi</th>
              <th className="px-6 py-3.5 text-left">Deskripsi Pelanggaran</th>
              <th className="px-6 py-3.5 text-left">Masa Berlaku</th>
              {canManageSanctions && <th className="px-6 py-3.5 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan={canManageSanctions ? 4 : 3} className="px-6 py-16 text-center text-slate-400">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : sanctions.length === 0 ? (
                <tr>
                  <td colSpan={canManageSanctions ? 4 : 3}>
                    <EmptyState
                      icon={<ShieldAlert className="h-10 w-10 text-slate-300" />}
                      title="Belum Ada Sanksi Presensi"
                      description="Seluruh karyawan mematuhi disiplin presensi."
                    />
                  </td>
                </tr>
              ) : (
                sanctions.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <AnimatedBadge variant={getTypeBadge(s.type)}>
                        {s.type.replace("_", " ")}
                      </AnimatedBadge>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {s.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {formatDate(s.startDate)}
                      {s.endDate && ` s/d ${formatDate(s.endDate)}`}
                    </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadSP(s.id)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded-lg text-xs transition inline-flex items-center gap-1"
                          title="Cetak Surat Peringatan (SP PDF)"
                        >
                          <Download className="h-3.5 w-3.5" /> SP PDF
                        </button>
                        {canManageSanctions && (
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition"
                            title="Hapus Sanksi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </TableContainer>

      {/* Modal Add Sanction */}
      {showModal && canManageSanctions && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Sanksi Presensi Baru">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Karyawan Penerima Sanksi *
              </label>
              <AutocompleteSelect
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                  sublabel: `NIK: ${emp.employeeId} • ${emp.position || "Staff"}`,
                }))}
                value={formData.employeeId}
                onChange={(val) => setFormData({ ...formData, employeeId: val })}
                placeholder="-- Cari Nama Karyawan --"
                searchPlaceholder="Ketik nama karyawan..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Sanksi *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                <option value="WARNING">Surat Peringatan 1 (SP1)</option>
                <option value="FINAL_WARNING">Surat Peringatan Terakhir (SP3)</option>
                <option value="SUSPENSION">Suspensi Skorsing Kerja</option>
                <option value="DEMOTION">Penurunan Jabatan / Demosi</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deskripsi Pelanggaran *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tuliskan kronologi indisipliner / keterlambatan..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium resize-none"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Mulai Berlaku *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Berakhir (Opsional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition"
              >
                Simpan Sanksi
              </button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
