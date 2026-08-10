"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Clock, Users, Calendar, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SectionHeader,
  ModernButton,
  AnimatedBadge,
  EmptyState,
  LoadingSpinner,
  Modal,
  AnimatedCard,
} from "@/components/ui";
import { ImportModal } from "@/components/import-modal";
import { usePermissions } from "@/hooks/use-permissions";

interface Schedule {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isFlexible: boolean;
  gracePeriod: number | null;
  _count: { employees: number };
}

export default function SchedulePage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "OFFICE",
    startTime: "08:00",
    endTime: "17:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    isFlexible: false,
    gracePeriod: 15,
  });

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    const res = await fetch("/api/absensi/schedule");
    if (res.ok) { setSchedules(await res.json()); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      await fetch(`/api/absensi/schedule?id=${editingSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch("/api/absensi/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setShowModal(false);
    setEditingSchedule(null);
    resetForm();
    fetchSchedules();
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name, type: schedule.type, startTime: schedule.startTime,
      endTime: schedule.endTime, breakStart: schedule.breakStart || "",
      breakEnd: schedule.breakEnd || "", isFlexible: schedule.isFlexible,
      gracePeriod: schedule.gracePeriod || 15,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    await fetch(`/api/absensi/schedule?id=${id}`, { method: "DELETE" });
    fetchSchedules();
  };

  const resetForm = () => {
    setFormData({ name: "", type: "OFFICE", startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00", isFlexible: false, gracePeriod: 15 });
  };

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, "info" | "warning" | "success" | "default"> = {
      OFFICE: "info",
      SHIFT: "warning",
      REMOTE: "success",
      HYBRID: "default",
    };
    return variants[type] || "default";
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = { OFFICE: "Jam Kantor", SHIFT: "Shift", REMOTE: "Remote", HYBRID: "Hibrida" };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Jadwal Kerja"
        description="Kelola jadwal kerja, shift, dan roster"
        action={
          canManage ? (
            <div className="flex items-center gap-2">
              <ModernButton
                variant="secondary"
                icon={<Upload className="h-4 w-4" />}
                onClick={() => setShowImport(true)}
              >
                Import
              </ModernButton>
              <ModernButton
                icon={<Plus className="h-4 w-4" />}
                onClick={() => { resetForm(); setEditingSchedule(null); setShowModal(true); }}
              >
                Tambah Jadwal
              </ModernButton>
            </div>
          ) : undefined
        }
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={fetchSchedules}
        type="schedule"
        title="Import Jadwal Kerja"
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="Belum ada jadwal"
          description="Buat jadwal kerja pertama untuk mengelola waktu kerja karyawan"
          action={
            canManage ? (
              <ModernButton
                icon={<Plus className="h-4 w-4" />}
                onClick={() => { resetForm(); setEditingSchedule(null); setShowModal(true); }}
              >
                Tambah Jadwal
              </ModernButton>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {schedules.map((schedule, i) => (
              <motion.div
                key={schedule.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <AnimatedCard delay={i * 0.06} className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">{schedule.name}</h3>
                      <AnimatedBadge variant={getTypeBadgeVariant(schedule.type)}>
                        {getTypeLabel(schedule.type)}
                      </AnimatedBadge>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="h-4 w-4" />}
                          onClick={() => handleEdit(schedule)}
                        >
                          Edit
                        </ModernButton>
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDelete(schedule.id)}
                        >
                          Hapus
                        </ModernButton>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    {schedule.breakStart && schedule.breakEnd && (
                      <div className="text-sm text-gray-500 ml-6">
                        Istirahat: {schedule.breakStart} - {schedule.breakEnd}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{schedule._count.employees} karyawan</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100">
                    <AnimatedBadge variant={schedule.isFlexible ? "success" : "default"}>
                      {schedule.isFlexible ? "Fleksibel" : "Tetap"}
                    </AnimatedBadge>
                    {schedule.gracePeriod && (
                      <span className="text-xs text-gray-400">Toleransi: {schedule.gracePeriod} menit</span>
                    )}
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingSchedule(null); }}
        title={editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Jadwal</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Contoh: Jam Kerja Pagi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="OFFICE">Jam Kantor</option>
              <option value="SHIFT">Shift</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hibrida</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Mulai</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Selesai</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Istirahat Mulai</label>
              <input
                type="time"
                value={formData.breakStart}
                onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Istirahat Selesai</label>
              <input
                type="time"
                value={formData.breakEnd}
                onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Toleransi (menit)</label>
              <input
                type="number"
                value={formData.gracePeriod}
                onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                min="0"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isFlexible"
                checked={formData.isFlexible}
                onChange={(e) => setFormData({ ...formData, isFlexible: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isFlexible" className="text-sm font-medium text-gray-700">Jam Fleksibel</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <ModernButton
              type="button"
              variant="secondary"
              onClick={() => { setShowModal(false); setEditingSchedule(null); }}
            >
              Batal
            </ModernButton>
            <ModernButton type="submit">
              {editingSchedule ? "Simpan" : "Tambah"}
            </ModernButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
