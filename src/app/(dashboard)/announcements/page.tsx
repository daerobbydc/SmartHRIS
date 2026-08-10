"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  Sparkles,
  Users,
  Building2,
  Clock,
  Pin,
  Tag,
  Search,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { usePermissions } from "@/hooks/use-permissions";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAll: boolean;
  targetDepts: string | null;
  targetRoles: string | null;
  publishAt: string;
  expiresAt: string | null;
  authorId: string;
  authorName: string;
  views: number;
}

export default function AnnouncementsPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "MEDIUM",
    targetAll: true,
    targetDepts: "",
    targetRoles: "",
    publishAt: new Date().toISOString().slice(0, 16),
    expiresAt: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        targetDepts: form.targetDepts || null,
        targetRoles: form.targetRoles || null,
        publishAt: new Date(form.publishAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingId) {
        await fetch(`/api/announcements?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      setShowDialog(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      priority: "MEDIUM",
      targetAll: true,
      targetDepts: "",
      targetRoles: "",
      publishAt: new Date().toISOString().slice(0, 16),
      expiresAt: "",
    });
    setEditingId(null);
  };

  const editAnnouncement = (ann: Announcement) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      targetAll: ann.targetAll,
      targetDepts: ann.targetDepts || "",
      targetRoles: ann.targetRoles || "",
      publishAt: new Date(ann.publishAt).toISOString().slice(0, 16),
      expiresAt: ann.expiresAt
        ? new Date(ann.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setShowDialog(true);
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesPriority = priorityFilter === "ALL" || ann.priority === priorityFilter;
    const matchesSearch =
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
      case "HIGH":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      case "MEDIUM":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    }
  };

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
              Pengumuman Perusahaan (Announcements)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Megaphone className="h-3.5 w-3.5" /> Portal Informasi
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publikasikan edaran internal, SOP perusahaan, dan pemberitahuan penting untuk karyawan.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" /> Buat Pengumuman Baru
          </button>
        )}
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Dipublikasikan</span>
            <Megaphone className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {announcements.length} <span className="text-xs font-normal text-slate-400">Pengumuman</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase tracking-wider">
            <span>Pengumuman Urgent</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600">
            {announcements.filter((a) => a.priority === "URGENT").length} <span className="text-xs font-normal text-slate-400">Penting</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase tracking-wider">
            <span>Total Pembaca (Views)</span>
            <Eye className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {announcements.reduce((acc, a) => acc + (a.views || 0), 0)}{" "}
            <span className="text-xs font-normal text-slate-400">Kali Dilihat</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci judul atau isi pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                priorityFilter === p
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {p === "ALL" ? "Semua Prioritas" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          Memuat pengumuman...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Belum Ada Pengumuman
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol <strong>Buat Pengumuman Baru</strong> untuk mempublikasikan berita internal perusahaan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:border-teal-500/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold ${getPriorityBadgeClass(
                        ann.priority
                      )}`}
                    >
                      <Tag className="h-3 w-3" /> Prioritas {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ann.publishAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-teal-600" />
                      {ann.views} Pembaca
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {ann.title}
                  </h3>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => editAnnouncement(ann)}
                      className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-300 transition"
                      title="Edit Pengumuman"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300 transition"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Target Penerima:</span>
                  {ann.targetAll ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      <Users className="h-3 w-3" /> Semua Karyawan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Building2 className="h-3 w-3" /> {ann.targetDepts || "Spesifik"} ({ann.targetRoles || "Semua Role"})
                    </span>
                  )}
                </div>

                {ann.expiresAt && (
                  <span>
                    Berlaku s/d: {new Date(ann.expiresAt).toLocaleDateString("id-ID")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog Modal */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sampaikan informasi resmi kepada seluruh staf atau departemen spesifik.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Edaran Libur Nasional & Penyesuaian Shift"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi / Detail Pengumuman
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Tuliskan isi pengumuman di sini..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <AutocompleteSelect
                    options={[
                      { value: "LOW", label: "Low (Rendah)", sublabel: "Informasi umum" },
                      { value: "MEDIUM", label: "Medium (Sedang)", sublabel: "Pemberitahuan rutin" },
                      { value: "HIGH", label: "High (Tinggi)", sublabel: "Penting wajib dibaca" },
                      { value: "URGENT", label: "Urgent (Mendesak)", sublabel: "Segera ditindaklanjuti" },
                    ]}
                    value={form.priority}
                    onChange={(val) => setForm({ ...form, priority: val })}
                    placeholder="-- Pilih Prioritas --"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Penerima
                  </label>
                  <select
                    value={form.targetAll ? "all" : "custom"}
                    onChange={(e) => setForm({ ...form, targetAll: e.target.value === "all" })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option value="all">Semua Karyawan (All Staff)</option>
                    <option value="custom">Spesifik Departemen / Role</option>
                  </select>
                </div>
              </div>

              {!form.targetAll && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Departemen (Pisah Koma)
                    </label>
                    <input
                      type="text"
                      value={form.targetDepts}
                      onChange={(e) => setForm({ ...form, targetDepts: e.target.value })}
                      placeholder="Contoh: IT, HR, Finance"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role Akses (Pisah Koma)
                    </label>
                    <input
                      type="text"
                      value={form.targetRoles}
                      onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
                      placeholder="Contoh: ADMIN, MANAGER"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kadaluarsa (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  {editingId ? "Simpan Perubahan" : "Publikasikan Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
