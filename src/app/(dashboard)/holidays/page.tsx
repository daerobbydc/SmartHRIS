"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Download,
  Globe,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  Palmtree,
  Moon,
  Flag,
  Tag,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";
import { usePermissions } from "@/hooks/use-permissions";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  year: number;
}

export default function HolidaysPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const [addForm, setAddForm] = useState({
    name: "",
    date: "",
    type: "NATIONAL",
  });

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${selectedYear}`);
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      setShowAddDialog(false);
      setAddForm({ name: "", date: "", type: "NATIONAL" });
      fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus hari libur ini?")) return;
    try {
      await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      fetchHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
    }
  };

  const handleImportIndonesianHolidays = async () => {
    setImporting(true);
    try {
      const res = await fetch(`/api/holidays?action=indo-holidays&year=${selectedYear}`);
      const data = await res.json();
      const list = data.holidays || [];

      await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-import",
          holidays: list.map((h: any) => ({
            name: h.name,
            date: h.date,
            type: h.type,
          })),
        }),
      });

      setShowImportDialog(false);
      fetchHolidays();
    } catch (error) {
      console.error("Error importing holidays:", error);
    } finally {
      setImporting(false);
    }
  };

  const filteredHolidays = holidays.filter((h) => {
    if (typeFilter !== "ALL" && h.type !== typeFilter) return false;
    return true;
  });

  const getHolidayBadgeClass = (type: string) => {
    switch (type) {
      case "NATIONAL":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
      case "RELIGIOUS":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300";
      case "COLLECTIVE":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "NATIONAL":
        return "Libur Nasional";
      case "RELIGIOUS":
        return "Hari Raya Keagamaan";
      case "COLLECTIVE":
        return "Cuti Bersama";
      default:
        return type;
    }
  };

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

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
              Kalender Hari Libur Nasional & Keagamaan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <CalendarIcon className="h-3.5 w-3.5" /> Kalender Kerja
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daftar libur resmi nasional, hari raya keagamaan, dan jadwal cuti bersama perusahaan.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 transition"
            >
              <Download className="h-4 w-4 text-teal-600" /> Auto-Import Libur RI
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" /> Tambah Libur Manual
            </button>
          </div>
        )}
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Libur Tahun {selectedYear}</span>
            <CalendarIcon className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {holidays.length} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase tracking-wider">
            <span>Libur Nasional</span>
            <Flag className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600">
            {holidays.filter((h) => h.type === "NATIONAL").length} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Hari Raya Keagamaan</span>
            <Moon className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600">
            {holidays.filter((h) => h.type === "RELIGIOUS").length} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase tracking-wider">
            <span>Cuti Bersama</span>
            <Palmtree className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-cyan-600">
            {holidays.filter((h) => h.type === "COLLECTIVE").length} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Holidays Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Tipe:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="NATIONAL">Libur Nasional</option>
                <option value="RELIGIOUS">Hari Raya Keagamaan</option>
                <option value="COLLECTIVE">Cuti Bersama</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Tahun Fiskal:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Hari Libur {selectedYear}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-6 py-3.5">Nama Hari Libur</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    {canManage && <th className="px-6 py-3.5 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Memuat kalender libur...
                      </td>
                    </tr>
                  ) : filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Belum ada hari libur. Klik <strong>Auto-Import Libur RI</strong> di atas.
                      </td>
                    </tr>
                  ) : (
                    filteredHolidays.map((holiday) => (
                      <tr key={holiday.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {new Date(holiday.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {holiday.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${getHolidayBadgeClass(holiday.type)}`}>
                            {getTypeLabel(holiday.type)}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition"
                              title="Hapus Hari Libur"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Holidays Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-teal-600" /> Hari Libur Mendatang
            </h2>

            {upcomingHolidays.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Tidak ada hari libur mendatang.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {holiday.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(holiday.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-extrabold border ${getHolidayBadgeClass(holiday.type)}`}>
                      {getTypeLabel(holiday.type)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Holiday Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Tambah Hari Libur Manual
              </h3>
              <button onClick={() => setShowAddDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Hari Libur
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Contoh: Hari Raya Nyepi"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Libur
                </label>
                <AutocompleteSelect
                  options={[
                    { value: "NATIONAL", label: "Libur Nasional", sublabel: "Hari besar kenegaraan" },
                    { value: "RELIGIOUS", label: "Hari Raya Keagamaan", sublabel: "Idul Fitri, Natal, Waisak, Nyepi, dll" },
                    { value: "COLLECTIVE", label: "Cuti Bersama", sublabel: "Cuti bersama resmi pemerintah" },
                  ]}
                  value={addForm.type}
                  onChange={(val) => setAddForm({ ...addForm, type: val })}
                  placeholder="-- Pilih Kategori --"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  Simpan Hari Libur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Auto-Import Hari Libur Indonesia
              </h3>
              <button onClick={() => setShowImportDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Sistem akan secara otomatis menarik data kalender resmi Hari Libur Nasional & Keagamaan Republik Indonesia untuk tahun <strong>{selectedYear}</strong>.
              </p>
              <div className="rounded-xl bg-teal-50/70 p-3 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300">
                <strong>Termasuk:</strong> Tahun Baru, Isra Mi'raj, Imlek, Nyepi, Waisak, Idul Fitri, Idul Adha, Kenaikan Isa Almasih, HUT RI, Natal, dan Cuti Bersama Resmi.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportDialog(false)}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleImportIndonesianHolidays}
                className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                {importing ? "Mengimpor..." : `Import Kalender ${selectedYear}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
