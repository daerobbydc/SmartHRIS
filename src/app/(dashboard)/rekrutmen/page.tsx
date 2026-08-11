"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Users, MapPin, Calendar, X, DollarSign, FileText, Target, Building2, Sparkles, ChevronRight, CheckCircle2, Share2, ExternalLink, Copy } from "lucide-react";
import { formatDate, getStatusLabel, getVacancyTypeLabel } from "@/lib/utils";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Vacancy {
  id: string;
  title: string;
  department: string;
  position: string;
  description: string;
  requirements: string;
  salary: string | null;
  type: string;
  location: string | null;
  status: string;
  deadline: string | null;
  _count: { applicants: number };
}

export default function RekrutmenPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (vacancyId?: string) => {
    const url = vacancyId
      ? `${window.location.origin}/careers?id=${vacancyId}`
      : `${window.location.origin}/careers`;
    navigator.clipboard.writeText(url);
    setCopiedId(vacancyId || "all");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const [formData, setFormData] = useState({
    title: "",
    department: "Engineering",
    position: "",
    description: "",
    requirements: "",
    salary: "",
    type: "FULL_TIME",
    location: "Jakarta, Indonesia (Hybrid)",
    deadline: "",
  });

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await fetch("/api/rekrutmen");
      if (res.ok) {
        const data = await res.json();
        setVacancies(data);
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/rekrutmen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setShowModal(false);
    fetchVacancies();
  };

  const handleCloseVacancy = async (id: string) => {
    await fetch(`/api/rekrutmen?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    fetchVacancies();
  };

  const activeCount = vacancies.filter((v) => v.status === "OPEN").length;
  const totalApplicants = vacancies.reduce((sum, v) => sum + (v._count?.applicants || 0), 0);
  const closedCount = vacancies.filter((v) => v.status === "CLOSED").length;

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
              Lowongan Pekerjaan & Rekrutmen AI
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Briefcase className="h-3.5 w-3.5" /> Talent Acquisition
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola pembukaan lowongan karir, publikasi posisi baru, dan pemeringkatan pelamar berbasis AI NLP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopyLink()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            title="Salin Link Portal Karir Publik"
          >
            {copiedId === "all" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Link Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-teal-600" /> Salin Link Karir
              </>
            )}
          </button>

          <a
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300 transition"
          >
            <ExternalLink className="h-4 w-4" /> Portal Karir Publik
          </a>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" /> Buat Lowongan Baru
          </button>
        </div>
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Lowongan Aktif (Open)</span>
            <Briefcase className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {activeCount} <span className="text-xs font-normal text-slate-400">Posisi</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Pelamar Masuk</span>
            <Users className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-teal-600">
            {totalApplicants} <span className="text-xs font-normal text-slate-400">Kandidat CV</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Ditutup (Closed)</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            {closedCount} <span className="text-xs font-normal text-slate-400">Lowongan</span>
          </p>
        </div>
      </div>

      {/* Vacancy Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          Memuat daftar lowongan pekerjaan...
        </div>
      ) : vacancies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Belum Ada Lowongan Pekerjaan
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol <strong>Buat Lowongan Baru</strong> untuk mulai membuka posisi rekrutmen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 hover:border-teal-500/40 transition-all duration-300 overflow-hidden"
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  vacancy.status === "OPEN"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              />

              <div>
                {/* Header Title & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      <Building2 className="h-3 w-3" /> {vacancy.department}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                      {vacancy.title}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                      vacancy.status === "OPEN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {vacancy.status === "OPEN" ? "Aktif" : "Ditutup"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {vacancy.description}
                </p>

                {/* Details Badges */}
                <div className="space-y-2 mb-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-teal-600" />
                    <span className="font-semibold">{vacancy.position}</span>
                  </div>

                  {vacancy.location && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{vacancy.location}</span>
                    </div>
                  )}

                  {vacancy.salary && (
                    <div className="flex items-center gap-2 font-bold text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{vacancy.salary}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Pill & Action Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50/80 px-2.5 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    <Users className="h-3.5 w-3.5" />
                    {vacancy._count?.applicants || 0} Pelamar CV
                  </span>

                  {vacancy.deadline && (
                    <span className="text-[11px] text-slate-400">
                      s/d {formatDate(vacancy.deadline)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(vacancy.id)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition flex items-center gap-1"
                    title="Salin Link Lowongan ke Clipboard"
                  >
                    {copiedId === vacancy.id ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-teal-600" /> Salin Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      (window.location.href = `/rekrutmen/applicants?vacancy=${vacancy.id}`)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Pelamar & AI Match
                  </button>

                  {vacancy.status === "OPEN" && (
                    <button
                      onClick={() => handleCloseVacancy(vacancy.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-300 transition"
                    >
                      Tutup
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Vacancy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Buat Lowongan Pekerjaan Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publikasikan posisi karir baru untuk menjaring talenta terbaik.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Lowongan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Senior Fullstack Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

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
                    value={formData.department}
                    onChange={(val) => setFormData({ ...formData, department: val })}
                    placeholder="-- Pilih Departemen --"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Posisi / Jabatan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Contoh: Lead Developer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe Pekerjaan
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  >
                    <option value="FULL_TIME">Full Time (Penuh Waktu)</option>
                    <option value="PART_TIME">Part Time (Paruh Waktu)</option>
                    <option value="CONTRACT">Contract (Kontrak)</option>
                    <option value="INTERNSHIP">Internship (Magang)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Penempatan
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Jakarta (Hybrid)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kisaran Gaji (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="Contoh: Rp 10 - 15 Juta"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Pekerjaan
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tuliskan gambaran umum tugas dan tanggung jawab..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kualifikasi & Persyaratan
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Tuliskan persyaratan pendidikan, keahlian, dan pengalaman..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Akhir Pendaftaran (Deadline)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
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
                  Publikasikan Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
