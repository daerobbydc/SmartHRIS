"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, Filter, ChevronLeft, ChevronRight, Upload, UserPlus, Building2, Mail, Phone, DollarSign, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, ModernButton, TableContainer, EmptyState, AnimatedBadge } from "@/components/ui";
import { ImportModal } from "@/components/import-modal";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { usePermissions } from "@/hooks/use-permissions";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  status: string;
  user: { email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "Engineering",
    position: "Software Engineer",
    hireDate: new Date().toISOString().split("T")[0],
    salary: "8000000",
    status: "ACTIVE",
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        department,
        status,
      });

      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [pagination.page, search, department, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEmployees();
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          salary: parseFloat(addForm.salary) || 0,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        resetAddForm();
        fetchEmployees();
      }
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setAddForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      employeeId: "",
      department: "Engineering",
      position: "Software Engineer",
      hireDate: new Date().toISOString().split("T")[0],
      salary: "8000000",
      status: "ACTIVE",
    });
  };

  const handleDelete = async (id: string) => {
    if (!canManage) {
      alert("Akses ditolak: Karyawan biasa tidak dapat menghapus data karyawan.");
      return;
    }
    if (!confirm("Yakin ingin menghapus karyawan ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus karyawan");
      }
    } catch (error) {
      console.error("Gagal menghapus karyawan:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
      ACTIVE: "success",
      INACTIVE: "default",
      TERMINATED: "danger",
      ON_LEAVE: "warning",
    };
    return map[status] || "default";
  };

  return (
    <div className="space-y-6 p-1">
      <SectionHeader
        title="Data Karyawan"
        description="Kelola data kepegawaian & profil staf"
        action={
          canManage ? (
            <div className="flex items-center gap-2">
              <ModernButton
                variant="secondary"
                icon={<Upload className="h-4 w-4" />}
                onClick={() => setShowImport(true)}
              >
                Import CSV
              </ModernButton>
              <ModernButton
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddModal(true)}
              >
                Tambah Karyawan
              </ModernButton>
            </div>
          ) : undefined
        }
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={fetchEmployees}
        type="employees"
        title="Import Data Karyawan"
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs dark:bg-slate-900 dark:border-slate-800"
      >
        <form onSubmit={handleSearch} className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari NIK, nama, atau posisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-semibold text-gray-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all cursor-pointer"
          >
            <option value="">Semua Departemen</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Non-Aktif</option>
            <option value="ON_LEAVE">Cuti</option>
            <option value="TERMINATED">Terminasi</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-10 w-10" />}
          title="Tidak ada karyawan ditemukan"
          description="Coba ubah kata kunci pencarian atau filter yang Anda gunakan."
        />
      ) : (
        <TableContainer>
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3.5 text-left">NIK</th>
                <th className="px-6 py-3.5 text-left">Nama</th>
                <th className="px-6 py-3.5 text-left">Departemen</th>
                <th className="px-6 py-3.5 text-left">Jabatan</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-900 dark:divide-slate-800 text-xs">
              {employees.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {emp.employeeId}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    <div>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-[11px] font-normal text-slate-400">
                      {emp.user?.email || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                    {emp.department}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                    {emp.position}
                  </td>
                  <td className="px-6 py-4">
                    <AnimatedBadge variant={getStatusBadge(emp.status)}>
                      {getStatusLabel(emp.status)}
                    </AnimatedBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {canManage && (
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-500">
              Menampilkan {employees.length} dari {pagination.total} karyawan
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold px-2">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </TableContainer>
      )}

      {/* Add Employee Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Tambah Karyawan Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lengkapi formulir profil & data kepegawaian.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Depan *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    placeholder="Contoh: Budi"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Belakang *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    placeholder="Contoh: Santoso"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="budi.santoso@perusahaan.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIK Karyawan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={addForm.employeeId}
                    onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                    placeholder="Otomatis jika dikosongkan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departemen
                  </label>
                  <AutocompleteSelect
                    options={[
                      { value: "Engineering", label: "Engineering & IT" },
                      { value: "Human Resources", label: "Human Resources (HR)" },
                      { value: "Marketing", label: "Marketing & Growth" },
                      { value: "Finance", label: "Finance & Accounting" },
                      { value: "Operations", label: "Operations & Logistics" },
                    ]}
                    value={addForm.department}
                    onChange={(val) => setAddForm({ ...addForm, department: val })}
                    placeholder="-- Pilih Departemen --"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Posisi *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.position}
                    onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                    placeholder="Contoh: Senior Developer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Bergabung (Hire Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={addForm.hireDate}
                    onChange={(e) => setAddForm({ ...addForm, hireDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gaji Pokok (Rp / Bulan) *
                  </label>
                  <input
                    type="number"
                    required
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                    placeholder="8000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Karyawan Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
