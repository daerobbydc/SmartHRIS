"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, Trash2, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SectionHeader, ModernButton, AnimatedBadge, TableContainer, EmptyState, LoadingSpinner, Modal } from "@/components/ui";

interface Training {
  id: string;
  name: string;
  provider: string | null;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  certificate: string | null;
  status: string;
  employee: { employeeId: string; firstName: string; lastName: string; department: string };
}

interface Employee { id: string; employeeId: string; firstName: string; lastName: string; }

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [formData, setFormData] = useState({
    employeeId: "", name: "", provider: "", startDate: "", endDate: "", duration: "", certificate: "",
  });

  useEffect(() => { fetchTrainings(); fetchEmployees(); }, []);

  const fetchTrainings = async () => {
    const res = await fetch("/api/personalia/training");
    if (res.ok) { setTrainings(await res.json()); }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees?limit=100");
    if (res.ok) { setEmployees((await res.json()).employees); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/personalia/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    fetchTrainings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data training?")) return;
    await fetch(`/api/personalia/training?id=${id}`, { method: "DELETE" });
    fetchTrainings();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="History Training"
        description="Kelola riwayat pelatihan karyawan"
        action={
          <ModernButton onClick={() => setShowModal(true)} variant="primary">
            <Plus className="h-4 w-4" />
            Tambah Training
          </ModernButton>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : trainings.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="Belum ada data training"
          description="Mulai tambahkan riwayat pelatihan karyawan"
          action={
            <ModernButton onClick={() => setShowModal(true)} variant="primary">
              Tambah Training
            </ModernButton>
          }
        />
      ) : (
        <TableContainer>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Karyawan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Training</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Penyelenggara</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durasi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sertifikat</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {trainings.map((t, index) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{t.employee.firstName} {t.employee.lastName}</p>
                      <p className="text-sm text-gray-500">{t.employee.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.provider || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(t.startDate)}{t.endDate && ` - ${formatDate(t.endDate)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {t.duration ? `${t.duration} jam` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {t.certificate ? (
                        <AnimatedBadge variant="success">
                          <Award className="h-3 w-3 mr-1" />
                          {t.certificate}
                        </AnimatedBadge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ModernButton
                        onClick={() => handleDelete(t.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ModernButton>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </TableContainer>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Training">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <GraduationCap className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tambah Training</h2>
                  <p className="text-sm text-gray-500">Isi data pelatihan karyawan</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Karyawan</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="">Pilih Karyawan</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.employeeId} - {e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Training</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Penyelenggara</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Durasi (jam)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sertifikat</label>
                    <input
                      type="text"
                      value={formData.certificate}
                      onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="Nama sertifikat"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <ModernButton type="button" onClick={() => setShowModal(false)} variant="ghost">
                    Batal
                  </ModernButton>
                  <ModernButton type="submit" variant="primary">
                    Simpan
                  </ModernButton>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
