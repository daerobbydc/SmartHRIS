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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
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

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "Engineering",
    position: "Software Engineer",
    salary: "8000000",
    status: "ACTIVE",
    nik: "",
    bankName: "BCA",
    bankAccount: "",
    bankBranch: "",
    npwp: "",
    ptkp: "TK/0",
  });

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditForm({
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      phone: (emp as any).phone || "",
      department: emp.department || "Engineering",
      position: emp.position || "Staff",
      salary: emp.salary ? emp.salary.toString() : "8000000",
      status: emp.status || "ACTIVE",
      nik: (emp as any).nik || "",
      bankName: (emp as any).bankName || "BCA",
      bankAccount: (emp as any).bankAccount || "",
      bankBranch: (emp as any).bankBranch || "",
      npwp: (emp as any).npwp || "",
      ptkp: (emp as any).ptkp || "TK/0",
    });
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employees?id=${editingEmpId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          salary: parseFloat(editForm.salary) || 0,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingEmpId(null);
        fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengedit karyawan");
      }
    } catch (error) {
      console.error("Error editing employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
                      <button
                        onClick={() => setSelectedEmp(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 transition"
                        title="Lihat Detail Profil"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition"
                            title="Edit Data Karyawan"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
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

      {/* View Employee Detail Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 font-bold text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  {selectedEmp.firstName?.[0]}{selectedEmp.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedEmp.firstName} {selectedEmp.lastName}
                  </h3>
                  <p className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {selectedEmp.employeeId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Departemen</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmp.department}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Jabatan / Posisi</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmp.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Email Korporasi</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{selectedEmp.user?.email || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Nomor Telepon</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{(selectedEmp as any).phone || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Status Kepegawaian</span>
                  <div className="mt-1">
                    <AnimatedBadge variant={getStatusBadge(selectedEmp.status)}>
                      {getStatusLabel(selectedEmp.status)}
                    </AnimatedBadge>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Gaji Pokok</span>
                  <p className="font-extrabold text-teal-700 dark:text-teal-400 mt-0.5">
                    {selectedEmp.salary ? formatCurrency(Number(selectedEmp.salary)) : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => setSelectedEmp(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Tutup Rincian
              </button>
              {canManage && (
                <button
                  onClick={() => {
                    const target = selectedEmp;
                    setSelectedEmp(null);
                    handleOpenEditModal(target);
                  }}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-md"
                >
                  Edit Data Karyawan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Edit Profil & Data Kepegawaian
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Perbarui informasi posisi, departemen, telepon, gaji, dan status aktif.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Depan *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departemen *
                  </label>
                  <AutocompleteSelect
                    options={[
                      { value: "Human Resources", label: "Human Resources" },
                      { value: "Engineering", label: "Engineering" },
                      { value: "Marketing", label: "Marketing" },
                      { value: "Finance", label: "Finance" },
                      { value: "Operations", label: "Operations" },
                    ]}
                    value={editForm.department}
                    onChange={(val) => setEditForm({ ...editForm, department: val })}
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
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Karyawan *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Aktif)</option>
                    <option value="INACTIVE">INACTIVE (Non-Aktif)</option>
                    <option value="ON_LEAVE">ON_LEAVE (Cuti)</option>
                    <option value="TERMINATED">TERMINATED (Terminasi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gaji Pokok (Rp / Bulan) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Informasi Rekening Bank & Pajak */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="font-extrabold text-teal-700 dark:text-teal-400">
                  Informasi Rekening Bank & Pajak
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIK KTP (16 Digit)
                    </label>
                    <input
                      type="text"
                      value={editForm.nik}
                      onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                      placeholder="3171012345670001"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Bank Transfer
                    </label>
                    <select
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">BNI (Bank Negara Indonesia)</option>
                      <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Bank Permata</option>
                      <option value="Danamon">Bank Danamon</option>
                      <option value="BTN">BTN</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Rekening Bank
                    </label>
                    <input
                      type="text"
                      value={editForm.bankAccount}
                      onChange={(e) => setEditForm({ ...editForm, bankAccount: e.target.value })}
                      placeholder="1234567890"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cabang Bank
                    </label>
                    <input
                      type="text"
                      value={editForm.bankBranch}
                      onChange={(e) => setEditForm({ ...editForm, bankBranch: e.target.value })}
                      placeholder="Cabang Sudirman"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor NPWP Pajak
                    </label>
                    <input
                      type="text"
                      value={editForm.npwp}
                      onChange={(e) => setEditForm({ ...editForm, npwp: e.target.value })}
                      placeholder="12.345.678.9-012.000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status PTKP (PPh 21 TER)
                    </label>
                    <select
                      value={editForm.ptkp}
                      onChange={(e) => setEditForm({ ...editForm, ptkp: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="TK/0">TK/0 - Tidak Kawin / 0 Tanggungan</option>
                      <option value="TK/1">TK/1 - Tidak Kawin / 1 Tanggungan</option>
                      <option value="TK/2">TK/2 - Tidak Kawin / 2 Tanggungan</option>
                      <option value="TK/3">TK/3 - Tidak Kawin / 3 Tanggungan</option>
                      <option value="K/0">K/0 - Kawin / 0 Tanggungan</option>
                      <option value="K/1">K/1 - Kawin / 1 Tanggungan</option>
                      <option value="K/2">K/2 - Kawin / 2 Tanggungan</option>
                      <option value="K/3">K/3 - Kawin / 3 Tanggungan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
