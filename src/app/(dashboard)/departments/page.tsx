"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Users,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editDept ? "PUT" : "POST";
      const body = editDept ? { id: editDept.id, ...form } : form;

      const res = await fetch("/api/departments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setEditDept(null);
        setForm({ name: "", description: "" });
        fetchDepartments();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan departemen");
      }
    } catch (error) {
      console.error("Error saving department:", error);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditDept(dept);
    setForm({
      name: dept.name,
      description: dept.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus departemen ini?")) return;
    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalEmployees = departments.reduce((acc, d) => acc + d.employeeCount, 0);
  const largestDept = departments.reduce(
    (max, d) => (d.employeeCount > (max?.employeeCount || 0) ? d : max),
    departments[0]
  );

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
              Manajemen Departemen Perusahaan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Building2 className="h-3.5 w-3.5" /> Struktur Organisasi
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola daftar departemen, divisi kerja, dan alokasi jumlah tenaga kerja perusahaan.
          </p>
        </div>

        <button
          onClick={() => {
            setEditDept(null);
            setForm({ name: "", description: "" });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" /> Tambah Departemen
        </button>
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Departemen</span>
            <Building2 className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white font-mono">
            {departments.length} <span className="text-xs font-normal text-slate-400">Divisi</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Total Karyawan Terdistribusi</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 font-mono">
            {totalEmployees} <span className="text-xs font-normal text-slate-400">Personel</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase tracking-wider">
            <span>Departemen Terbesar</span>
            <Sparkles className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-3 text-xl font-bold text-slate-900 dark:text-white truncate">
            {largestDept ? largestDept.name : "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {largestDept ? `${largestDept.employeeCount} Karyawan Aktif` : "Belum ada data"}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama departemen atau deskripsi..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          Menampilkan {filteredDepts.length} Departemen
        </span>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          Memuat daftar departemen...
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          Belum ada departemen ditemukan. Klik <strong>Tambah Departemen</strong> di atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredDepts.map((dept) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 hover:border-teal-500/40 transition-all duration-300 overflow-hidden"
              >
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 shadow-xs border border-teal-100 dark:border-teal-900">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {dept.name}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          Dibuat {formatDate(dept.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {dept.description || "Tidak ada deskripsi departemen."}
                  </p>
                </div>

                {/* Footer Employee Badge & Controls */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50/80 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    <Users className="h-3.5 w-3.5" />
                    {dept.employeeCount} Karyawan Aktif
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 transition"
                      title="Edit Departemen"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition"
                      title="Hapus Departemen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editDept ? "Edit Departemen" : "Tambah Departemen Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Departemen *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Engineering & IT"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Ruang Lingkup
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tuliskan gambaran divisi & fungsi kerja..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
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
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  {editDept ? "Simpan Perubahan" : "Buat Departemen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
