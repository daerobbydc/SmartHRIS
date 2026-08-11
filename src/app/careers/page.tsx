"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  FileText,
  Send,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Globe,
  Share2,
} from "lucide-react";

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
  createdAt: string;
}

interface Company {
  name: string;
  address: string;
  phone: string;
  email: string;
  letterheadLogo?: string;
}

export default function PublicCareerPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cvUrl: "",
    coverLetter: "",
  });

  useEffect(() => {
    fetchCareers();
  }, [search, selectedDept, selectedType]);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedDept !== "ALL") params.set("department", selectedDept);
      if (selectedType !== "ALL") params.set("type", selectedType);

      const res = await fetch(`/api/careers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVacancies(data.vacancies || []);
        setCompany(data.company || null);
      }
    } catch (err) {
      console.error("Error loading careers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancyId: selectedVacancy.id,
          ...form,
          source: "Portal Karir Resmi Web",
        }),
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        setForm({ name: "", email: "", phone: "", cvUrl: "", coverLetter: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Gagal mengirim lamaran kerja.");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      alert("Terjadi kesalahan koneksi saat mengirim lamaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const departments = Array.from(new Set(vacancies.map((v) => v.department)));

  const getJobTypeBadge = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return { label: "Penuh Waktu (Full Time)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "PART_TIME":
        return { label: "Paruh Waktu (Part Time)", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "CONTRACT":
        return { label: "Kontrak (PKWT)", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "INTERNSHIP":
        return { label: "Magang (Internship)", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "FREELANCE":
        return { label: "Lepas (Freelance)", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      default:
        return { label: type, color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.letterheadLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.letterheadLogo} alt="Logo Perusahaan" className="h-10 object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 font-bold text-white shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                {company?.name || "PT SmartHRIS Indonesia"}
              </h1>
              <p className="text-xs text-teal-400 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Career Opportunities & Recruitment Portal
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-teal-400" /> {company?.email || "info@smarthris.com"}
            </span>
            <a
              href="/login"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition"
            >
              Portal Karyawan
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800/80 to-slate-900 py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-950/80 px-4 py-1.5 text-xs font-bold text-teal-400 border border-teal-800/60">
            <UserCheck className="h-4 w-4" /> Bergabunglah Bersama Tim Profesional Kami
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Temukan Karir Impian Anda di <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">{company?.name || "SmartHRIS"}</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kami membuka kesempatan bagi talenta terbaik untuk berkembang, berinovasi, dan memberikan kontribusi positif. Jelajahi lowongan kerja aktif di bawah ini.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-8">
        {/* Search & Filters Bar */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-3xl p-5 shadow-xl grid gap-4 md:grid-cols-12">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul posisi, kualifikasi, atau skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-3 px-4 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-3 px-4 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
            >
              <option value="ALL">Semua Tipe Pekerjaan</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract / PKWT</option>
              <option value="INTERNSHIP">Internship / Magang</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
        </div>

        {/* Vacancies Grid */}
        {loading ? (
          <div className="text-center py-20 space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
            <p className="text-xs text-slate-400 font-medium">Memuat daftar lowongan pekerjaan aktif...</p>
          </div>
        ) : vacancies.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-3xl p-8 space-y-3">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Belum Ada Lowongan Aktif</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada lowongan pekerjaan yang cocok dengan pencarian Anda saat ini. Silakan periksa kembali di kemudian hari.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((vacancy) => {
              const badge = getJobTypeBadge(vacancy.type);
              return (
                <motion.div
                  key={vacancy.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/60 border border-slate-700/60 hover:border-teal-500/60 rounded-3xl p-6 shadow-md hover:shadow-teal-500/5 transition flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {new Date(vacancy.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition">
                        {vacancy.title}
                      </h3>
                      <p className="text-xs font-semibold text-teal-300 mt-1 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> {vacancy.department} • {vacancy.position}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {vacancy.description}
                    </p>

                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-xs text-slate-300">
                      {vacancy.location && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <MapPin className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                          <span>{vacancy.location}</span>
                        </div>
                      )}
                      {vacancy.salary && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Rp {vacancy.salary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-4 flex items-center justify-between gap-3 border-t border-slate-700/40">
                    <button
                      onClick={() => {
                        setSelectedVacancy(vacancy);
                        setShowApplyModal(false);
                      }}
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition"
                    >
                      Detail Lowongan <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVacancy(vacancy);
                        setShowApplyModal(true);
                        setSubmittedSuccess(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 transition flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Lamar Sekarang
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Vacancy Detail / Apply Modal */}
      <AnimatePresence>
        {selectedVacancy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                    {selectedVacancy.department} • {selectedVacancy.type}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-2">{selectedVacancy.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-teal-400" /> {selectedVacancy.location || "Indonesia"}
                    {selectedVacancy.salary && <span className="text-emerald-400 font-bold">• Rp {selectedVacancy.salary}</span>}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVacancy(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {showApplyModal ? (
                /* Application Form Mode */
                <div className="space-y-5">
                  {submittedSuccess ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="h-16 w-16 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-800">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Lamaran Berhasil Terkirim!</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Terima kasih telah melamar posisi <strong className="text-teal-300">{selectedVacancy.title}</strong> pada {company?.name}. Tim HR kami akan meninjau berkas Anda.
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedVacancy(null)}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                      >
                        Tutup Modal
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                      <h3 className="text-sm font-bold text-teal-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                        <Send className="h-4 w-4" /> Formulir Pendaftaran Lamaran Kerja
                      </h3>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Nama Lengkap Pelamar *</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap Anda..."
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-300 mb-1">Alamat Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="nama@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-300 mb-1">Nomor WhatsApp / HP *</label>
                          <input
                            type="text"
                            required
                            placeholder="081234567890"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Link Resume / CV (Google Drive / LinkedIn / Cloud) *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://drive.google.com/file/d/your-cv..."
                          value={form.cvUrl}
                          onChange={(e) => setForm({ ...form, cvUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Pastikan izin akses file telah diset menjadi "Siapa saja yang memiliki link".</p>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Surat Lamaran / Ringkasan Pengalaman Kerja</label>
                        <textarea
                          rows={3}
                          placeholder="Ceritakan pengalaman singkat & alasan Anda melamar posisi ini..."
                          value={form.coverLetter}
                          onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowApplyModal(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                        >
                          Kembali ke Detail
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 disabled:opacity-50"
                        >
                          {submitting ? "Kirim Lamaran..." : "Kirimkan Lamaran"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Vacancy Detail Mode */
                <div className="space-y-6 text-xs text-slate-300">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Deskripsi Pekerjaan</h3>
                    <p className="text-slate-400 whitespace-pre-line leading-relaxed">{selectedVacancy.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Persyaratan & Kualifikasi</h3>
                    <p className="text-slate-400 whitespace-pre-line leading-relaxed">{selectedVacancy.requirements}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500">
                      Batas waktu: {selectedVacancy.deadline ? new Date(selectedVacancy.deadline).toLocaleDateString("id-ID") : "Hingga Kuota Terpenuhi"}
                    </span>
                    <button
                      onClick={() => {
                        setShowApplyModal(true);
                        setSubmittedSuccess(false);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Lamar Posisi Ini
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
