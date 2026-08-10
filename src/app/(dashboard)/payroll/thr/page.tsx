"use client";

import { useEffect, useState } from "react";
import { Gift, Check, X } from "lucide-react";
import { formatCurrency, getStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  AnimatedBadge,
  TableContainer,
  EmptyState,
  LoadingSpinner,
  Modal,
} from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/hooks/use-permissions";

interface THR {
  id: string;
  year: number;
  amount: number;
  status: string;
  paidAt: string | null;
  employee: { employeeId: string; firstName: string; lastName: string; department: string; salary: number };
}

export default function THRPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [thrList, setThrList] = useState<THR[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; employeeId: string; firstName: string; lastName: string; salary: number }[]>([]);

  const [formData, setFormData] = useState({ employeeId: "", year: year, amount: "" });

  useEffect(() => { fetchTHR(); fetchEmployees(); }, [year]);

  const fetchTHR = async () => {
    setLoading(true);
    const res = await fetch(`/api/payroll/thr?year=${year}`);
    if (res.ok) { setThrList(await res.json()); }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees?limit=100");
    if (res.ok) { setEmployees((await res.json()).employees); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/payroll/thr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setShowModal(false);
    fetchTHR();
  };

  const handlePay = async (id: string) => {
    await fetch(`/api/payroll/thr?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }) });
    fetchTHR();
  };

  const totalTHR = thrList.reduce((sum, t) => sum + Number(t.amount), 0);
  const paidTHR = thrList.filter((t) => t.status === "PAID").reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="THR (Tunjangan Hari Raya)"
        description="Kelola tunjangan hari raya karyawan"
        action={
          canManage ? (
            <ModernButton icon={<Gift className="h-4 w-4" />} onClick={() => setShowModal(true)}>
              Tambah THR
            </ModernButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total THR"
          value={formatCurrency(totalTHR)}
          icon={<Gift className="h-6 w-6" />}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Sudah Dibayar"
          value={formatCurrency(paidTHR)}
          icon={<Check className="h-6 w-6" />}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="Belum Dibayar"
          value={formatCurrency(totalTHR - paidTHR)}
          icon={<X className="h-6 w-6" />}
          color="yellow"
          delay={0.2}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="flex items-center gap-3"
      >
        <label className="text-sm font-medium text-gray-700">Tahun</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </motion.div>

      <TableContainer>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Karyawan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gaji Pokok</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">THR</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              {canManage && <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16">
                  <LoadingSpinner size="lg" />
                </td>
              </tr>
            ) : thrList.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Gift className="h-10 w-10" />}
                    title="Belum ada data THR"
                    description="Tambahkan THR karyawan untuk memulai"
                  />
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {thrList.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{t.employee.firstName} {t.employee.lastName}</p>
                      <p className="text-sm text-gray-500">{t.employee.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(t.employee.salary)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(t.amount)}</td>
                    <td className="px-6 py-4">
                      <AnimatedBadge
                        variant={t.status === "PAID" ? "success" : "warning"}
                        pulse={t.status === "PENDING"}
                      >
                        {getStatusLabel(t.status)}
                      </AnimatedBadge>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        {t.status === "PENDING" && (
                          <ModernButton
                            variant="success"
                            size="sm"
                            onClick={() => handlePay(t.id)}
                          >
                            Bayar
                          </ModernButton>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </TableContainer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah THR"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Karyawan</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Pilih Karyawan</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.employeeId} - {e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah THR (IDR)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
              min="0"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <ModernButton variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Batal
            </ModernButton>
            <ModernButton type="submit">
              Simpan
            </ModernButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
