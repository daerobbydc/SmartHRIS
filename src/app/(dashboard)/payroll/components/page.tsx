"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, DollarSign, Download, FileText, Upload } from "lucide-react";
import { cn, getPayrollComponentTypeLabel } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
import { ImportModal } from "@/components/import-modal";
import { usePermissions } from "@/hooks/use-permissions";

interface Component {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number | null;
  percentage: number | null;
  isTaxable: boolean;
  isActive: boolean;
}

interface SalaryData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  baseSalary: number;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  npwp: string;
  ptkp: string;
}

const BPJS_RATES: Record<string, { employee?: string; employer: string }> = {
  JHT: { employee: "2%", employer: "3.7%" },
  JP: { employee: "1%", employer: "2%" },
  JKK: { employee: "-", employer: "0.24%" },
  JKM: { employee: "-", employer: "0.3%" },
  Kesehatan: { employee: "1%", employer: "4%" },
};

const PTKP_OPTIONS = [
  { value: "TK/0", label: "Tidak Kawin / 0 Anak" },
  { value: "TK/1", label: "Tidak Kawin / 1 Anak" },
  { value: "TK/2", label: "Tidak Kawin / 2 Anak" },
  { value: "TK/3", label: "Tidak Kawin / 3 Anak" },
  { value: "K/0", label: "Kawin / 0 Anak" },
  { value: "K/1", label: "Kawin / 1 Anak" },
  { value: "K/2", label: "Kawin / 2 Anak" },
  { value: "K/3", label: "Kawin / 3 Anak" },
];

const BANKS = [
  "BCA", "Mandiri", "BNI", "BRI", "BTN", "Danamon", "CIMB Niaga", "Permata",
];

export default function SalaryComponentsPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [components, setComponents] = useState<Component[]>([]);
  const [employees, setEmployees] = useState<SalaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Component | null>(null);
  const [activeTab, setActiveTab] = useState<"components" | "bank" | "bpjs">("components");

  const [formData, setFormData] = useState({
    name: "", type: "ALLOWANCE", category: "", amount: "", percentage: "", isTaxable: false,
  });
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { fetchComponents(); fetchEmployees(); }, []);

  const fetchComponents = async () => {
    const res = await fetch("/api/payroll/components");
    if (res.ok) { setComponents(await res.json()); }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees?limit=100");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/payroll/components?id=${editing.id}` : "/api/payroll/components";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setShowModal(false);
    setEditing(null);
    fetchComponents();
  };

  const handleEdit = (c: Component) => {
    setEditing(c);
    setFormData({ name: c.name, type: c.type, category: c.category, amount: c.amount?.toString() || "", percentage: c.percentage?.toString() || "", isTaxable: c.isTaxable });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus komponen gaji?")) return;
    await fetch(`/api/payroll/components?id=${id}`, { method: "DELETE" });
    fetchComponents();
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormData({ name: "", type: "ALLOWANCE", category: "", amount: "", percentage: "", isTaxable: false });
    setShowModal(true);
  };

  const getBadgeVariant = (type: string) => {
    if (type === "ALLOWANCE") return "success";
    if (type === "DEDUCTION") return "danger";
    return "info";
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Komponen Gaji"
        description="Kelola komponen gaji, rekening bank, dan BPJS karyawan"
        action={
          canManage ? (
            <ModernButton
              variant="secondary"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setShowImport(true)}
            >
              Import Gaji
            </ModernButton>
          ) : undefined
        }
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => { fetchComponents(); fetchEmployees(); }}
        type="payroll"
        title="Import Data Gaji"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "components", label: "Komponen Gaji", icon: DollarSign },
          { key: "bank", label: "Rekening Bank", icon: FileText },
          { key: "bpjs", label: "Info BPJS", icon: Download },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-teal-500 text-teal-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Components Tab */}
      {activeTab === "components" && (
        <>
          {canManage && (
            <div className="flex justify-end">
              <ModernButton
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                Tambah Komponen
              </ModernButton>
            </div>
          )}

          <TableContainer>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nilai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pajak</th>
                  {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12"><LoadingSpinner size="md" /></td></tr>
                ) : components.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState
                      icon={<DollarSign className="h-8 w-8" />}
                      title="Belum ada komponen gaji"
                      description="Mulai dengan menambahkan komponen gaji untuk karyawan"
                    />
                  </td></tr>
                ) : (
                  components.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4">
                        <AnimatedBadge variant={getBadgeVariant(c.type)}>
                          {getPayrollComponentTypeLabel(c.type)}
                        </AnimatedBadge>
                      </td>
                      <td className="px-6 py-4 text-sm">{c.category}</td>
                      <td className="px-6 py-4 text-sm">
                        {c.amount ? `Rp ${c.amount.toLocaleString()}` : c.percentage ? `${c.percentage}%` : "-"}
                      </td>
                      <td className="px-6 py-4">{c.isTaxable ? "Ya" : "Tidak"}</td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ModernButton variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => handleEdit(c)}>Edit</ModernButton>
                            <ModernButton variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleDelete(c.id)}>Hapus</ModernButton>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableContainer>
        </>
      )}

      {/* Bank Account Tab */}
      {activeTab === "bank" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-sm text-teal-700">
              <strong>Info:</strong> Data rekening bank digunakan untuk export file transfer bank. Pastikan nomor rekening sudah benar sebelum export.
            </p>
          </div>
          <TableContainer>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Rekening</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cabang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NPWP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTKP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{e.firstName} {e.lastName}</p>
                      <p className="text-sm text-gray-500">{e.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{e.bankName || "-"}</td>
                    <td className="px-6 py-4 text-sm font-mono">{e.bankAccount || "-"}</td>
                    <td className="px-6 py-4 text-sm">{e.bankBranch || "-"}</td>
                    <td className="px-6 py-4 text-sm font-mono">{e.npwp || "-"}</td>
                    <td className="px-6 py-4 text-sm">{e.ptkp || "TK/0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      )}

      {/* BPJS Tab */}
      {activeTab === "bpjs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BPJS Ketenagakerjaan */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BPJS Ketenagakerjaan</h3>
              <div className="space-y-3">
                {Object.entries(BPJS_RATES).filter(([k]) => k !== "Kesehatan").map(([key, rates]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{key === "JHT" ? "Jaminan Hari Tua" : key === "JP" ? "Jaminan Pensiun" : key === "JKK" ? "Jaminan Kecelakaan Kerja" : "Jaminan Kematian"}</span>
                    <div className="text-sm">
                      <span className="text-teal-600 font-semibold">Karyawan: {rates.employee || "0%"}</span>
                      <span className="text-gray-400 mx-2">|</span>
                      <span className="text-amber-600 font-semibold">Perusahaan: {rates.employer}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Batas gaji maksimal: Rp 12.167.200/bulan</p>
              </div>
            </div>

            {/* BPJS Kesehatan */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BPJS Kesehatan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Iuran Karyawan</span>
                  <span className="text-teal-600 font-semibold">1%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Iuran Perusahaan</span>
                  <span className="text-amber-600 font-semibold">4%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Total Iuran</span>
                  <span className="text-gray-900 font-bold">5%</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">Batas gaji maksimal: Rp 12.167.200/bulan</p>
              </div>
            </div>
          </div>

          {/* PPh 21 TER */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PPh 21 TER (PMK 168/2023)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-xl">
                <p className="text-sm font-semibold text-teal-700 mb-2">TER A</p>
                <p className="text-xs text-teal-600">Penghasilan Bruto ≤ Rp 500 juta/tahun</p>
                <p className="text-xs text-gray-500 mt-1">Tarif efektif rata-rata</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm font-semibold text-amber-700 mb-2">TER B</p>
                <p className="text-xs text-amber-600">Penghasilan Bruto &gt; Rp 500 juta - ≤ Rp 5 miliar/tahun</p>
                <p className="text-xs text-gray-500 mt-1">Tarif efektif rata-rata</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl">
                <p className="text-sm font-semibold text-rose-700 mb-2">TER C</p>
                <p className="text-xs text-rose-600">Penghasilan Bruto &gt; Rp 5 miliar/tahun</p>
                <p className="text-xs text-gray-500 mt-1">Tarif efektif rata-rata</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Component */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={`${editing ? "Edit" : "Tambah"} Komponen Gaji`}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="ALLOWANCE">Tunjangan</option>
                    <option value="DEDUCTION">Potongan</option>
                    <option value="BONUS">Bonus</option>
                    <option value="BENEFIT">Benefit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g., Transport, Makan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (IDR)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persen (%)</label>
                  <input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTaxable"
                  checked={formData.isTaxable}
                  onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                  className="h-4 w-4 text-teal-600 rounded"
                />
                <label htmlFor="isTaxable" className="text-sm text-gray-700">Kena Pajak (PPh 21)</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <ModernButton variant="secondary" type="button" onClick={() => setShowModal(false)}>Batal</ModernButton>
                <ModernButton variant="primary" type="submit">Simpan</ModernButton>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
