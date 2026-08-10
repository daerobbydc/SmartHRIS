"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
  Search,
  ChevronRight,
  Video,
  Pencil,
  Trash2,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface Module {
  id: string;
  title: string;
  contentType: string;
  contentUrl: string | null;
  bodyText: string | null;
  durationMin: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  totalHours: number;
  modules: Module[];
  _count: { enrollments: number };
}

export default function LmsPage() {
  const { role } = usePermissions();
  const canManage = role === "ADMIN" || role === "HR";

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [issuedCertCode, setIssuedCertCode] = useState<string | null>(null);

  // CRUD Modal State
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Onboarding & HR",
    level: "BEGINNER",
    totalHours: 2,
    moduleTitle: "",
    contentType: "VIDEO",
    durationMin: 15,
    contentUrl: "",
    bodyText: "",
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Failed to load LMS courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveModule(course.modules[0] || null);
    setProgress(35); // Initial progress preview
    setIssuedCertCode(null);
  };

  const handleOpenCreateModal = () => {
    setEditingCourseId(null);
    setForm({
      title: "",
      description: "",
      category: "Onboarding & HR",
      level: "BEGINNER",
      totalHours: 2,
      moduleTitle: "Modul 1: Pengenalan Dasar",
      contentType: "VIDEO",
      durationMin: 20,
      contentUrl: "https://www.youtube.com/watch?v=demo",
      bodyText: "",
    });
    setShowCrudModal(true);
  };

  const handleOpenEditModal = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourseId(course.id);
    const firstMod = course.modules[0];
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      totalHours: course.totalHours,
      moduleTitle: firstMod?.title || "",
      contentType: firstMod?.contentType || "VIDEO",
      durationMin: firstMod?.durationMin || 15,
      contentUrl: firstMod?.contentUrl || "",
      bodyText: firstMod?.bodyText || "",
    });
    setShowCrudModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        // Edit course & module via PUT
        const res = await fetch("/api/lms/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: editingCourseId,
            ...form,
          }),
        });

        if (res.ok) {
          setShowCrudModal(false);
          fetchCourses();
        }
      } else {
        // Create new course via POST
        const res = await fetch("/api/lms/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          setShowCrudModal(false);
          fetchCourses();
        }
      }
    } catch (err) {
      console.error("Save course error:", err);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus materi pelatihan "${title}"?`)) return;

    try {
      const res = await fetch(`/api/lms/courses?id=${courseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCourses();
      }
    } catch (err) {
      console.error("Delete course error:", err);
    }
  };

  const handleCompleteCourse = async () => {
    if (!selectedCourse) return;
    try {
      const res = await fetch("/api/lms/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: "emp_1",
          courseId: selectedCourse.id,
          progressPercent: 100,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(100);
        setIssuedCertCode(data.data.certificateCode || `CERT-HRIS-${Date.now().toString().slice(-6)}`);
      }
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              LMS & Training Certification Portal
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <GraduationCap className="h-3.5 w-3.5" /> Smart Learning
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Portal pelatihan internal, pemantauan jam pelatihan (*training hours tracker*), serta manajemen CRUD materi pelatihan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
            >
              <Plus className="h-4 w-4" /> Tambah Materi LMS Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Hours Tracker Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Jam Pelatihan (Hours Tracker)
            </span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-teal-700 dark:text-teal-400">
            24 <span className="text-sm font-normal text-slate-500">Jam Terkumulasi</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Memenuhi target 20 jam/tahun</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kursus Tersedia
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {courses.length} <span className="text-sm font-normal text-slate-500">Modul</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Kategori IT, HR, & Management</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sertifikat Terbit
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            4 <span className="text-sm font-normal text-slate-500">Sertifikat Internal</span>
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Dapat diunduh & diverifikasi</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Cari judul materi pelatihan atau kategori LMS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent px-3 py-1 text-sm text-slate-900 focus:outline-none dark:text-white"
        />
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
          Memuat daftar pelatihan LMS...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:border-teal-500 transition relative group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {course.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-400">{course.totalHours} Jam</span>
                  {canManage && (
                    <>
                      <button
                        onClick={(e) => handleOpenEditModal(course, e)}
                        title="Edit Materi"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCourse(course.id, course.title, e)}
                        title="Hapus Materi"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {course.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                  {course.description}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{course.modules.length} Modul Pembelajaran</span>
                <button
                  onClick={() => handleOpenCourse(course)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 dark:text-teal-400"
                >
                  Mulai Pelatihan <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Player & Certificate Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedCourse.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCourse.category} • {selectedCourse.totalHours} Jam Pelatihan
                </p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Progress Kelulusan Modul</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full rounded-full bg-slate-200 h-2 overflow-hidden dark:bg-slate-700">
                  <div className="h-2 bg-teal-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {activeModule && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-950 text-white">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 mb-2">
                    <Video className="h-4 w-4" /> Modul {activeModule.durationMin} Menit: {activeModule.title}
                  </div>
                  <div className="aspect-video w-full rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                    <div className="text-center p-6">
                      <PlayCircle className="mx-auto h-12 w-12 text-teal-500 mb-2 animate-pulse" />
                      <p className="text-xs text-slate-400">Media Player LMS SmartHRIS (Video Slide Simulasi)</p>
                    </div>
                  </div>
                </div>
              )}

              {issuedCertCode && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Award className="h-5 w-5 text-emerald-600" /> Sertifikat Internal Berhasil Diterbitkan!
                  </div>
                  <p className="mt-1 text-xs">
                    Nomor Sertifikat: <strong className="font-mono">{issuedCertCode}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Tutup
              </button>
              {!issuedCertCode ? (
                <button
                  onClick={handleCompleteCourse}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Selesaikan Modul & Terbitkan Sertifikat
                </button>
              ) : (
                <button
                  onClick={() => alert(`Mengunduh Sertifikat ${issuedCertCode}...`)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Unduh Sertifikat PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CRUD Create/Edit Course Modal */}
      {showCrudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {editingCourseId ? "Edit Materi Pelatihan LMS" : "Tambah Materi Pelatihan LMS Baru"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulir pengisian modul & kurikulum pelatihan internal karyawan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCrudModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourse} className="mt-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-teal-600" /> Judul Materi Pelatihan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Training Leadership & Management 101"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-teal-600" /> Kategori Pelatihan
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                  >
                    <option value="Onboarding & HR">Onboarding & HR</option>
                    <option value="IT & Security">IT & Security</option>
                    <option value="Leadership & Management">Leadership & Management</option>
                    <option value="Employee Guidance">Employee Guidance</option>
                    <option value="Finance & Tax">Finance & Tax</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-teal-600" /> Level & Durasi Jam
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Jam"
                      value={form.totalHours}
                      onChange={(e) => setForm({ ...form, totalHours: Number(e.target.value) })}
                      className="w-20 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Singkat Pelatihan
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Rincian tujuan dan topik pelatihan..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 shadow-xs focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white transition-all"
                />
              </div>

              <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/30 space-y-3">
                <div className="text-xs font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-teal-600" /> Modul & Materi Pembelajaran Utama
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Modul
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Modul (Misal: Modul 1: Standar Operational Procedure)"
                    value={form.moduleTitle}
                    onChange={(e) => setForm({ ...form, moduleTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipe Materi
                    </label>
                    <select
                      value={form.contentType}
                      onChange={(e) => setForm({ ...form, contentType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="VIDEO">VIDEO (YouTube / MP4 Streaming)</option>
                      <option value="DOCUMENT">DOCUMENT (Materi Bacaan / PDF)</option>
                      <option value="QUIZ">QUIZ (Evaluasi Pemahaman)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Durasi Modul (Menit)
                    </label>
                    <input
                      type="number"
                      placeholder="Menit"
                      value={form.durationMin}
                      onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tautan Video / File PDF (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... atau /documents/SOP.pdf"
                    value={form.contentUrl}
                    onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Rincian & Isi Materi Pembelajaran
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Isi teks panduan, poin penting, atau petunjuk pengerjaan..."
                    value={form.bodyText}
                    onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCrudModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition-all"
                >
                  {editingCourseId ? "Simpan Perubahan" : "Buat Materi LMS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

