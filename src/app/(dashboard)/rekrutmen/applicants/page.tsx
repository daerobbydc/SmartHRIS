"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Briefcase,
  Star,
  ShieldAlert,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";

interface AIScreeningAnalysis {
  applicantId: string;
  applicantName: string;
  vacancyTitle: string;
  matchScore: number;
  grade: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  areasOfConcern: string[];
  summary: string;
  recommendation: string;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  rating: number | null;
  coverLetter: string | null;
  notes: string | null;
  aiMatchScore: number | null;
  aiAnalysis: string | null;
  isBlacklisted: boolean;
  vacancy: {
    id: string;
    title: string;
    department: string;
  };
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [screeningLoading, setScreeningLoading] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIScreeningAnalysis | null>(null);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rekrutmen/applicants");
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (err) {
      console.error("Failed to load applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIScreening = async (applicantId: string) => {
    setScreeningLoading(applicantId);
    try {
      const res = await fetch("/api/rekrutmen/ai-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setSelectedAnalysis(data.result);
          fetchApplicants();
        }
      }
    } catch (err) {
      console.error("AI screening error:", err);
    } finally {
      setScreeningLoading(null);
    }
  };

  const filtered = applicants.filter(
    (app) =>
      (app.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (app.vacancy?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Manajemen Pelamar & AI Resume Screening
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" /> Smart Match
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Analisis kualifikasi pelamar terhadap persyaratan *Job Vacancy* menggunakan AI Matching Engine.
          </p>
        </div>

        <button
          onClick={fetchApplicants}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Pelamar
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Cari nama pelamar, email, atau posisi lamaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent px-3 py-1 text-sm text-slate-900 focus:outline-none dark:text-white"
        />
      </div>

      {/* Applicants List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
            Memuat data pelamar...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Belum ada data pelamar yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Nama Pelamar</th>
                  <th className="px-6 py-3">Posisi Dilamar</th>
                  <th className="px-6 py-3">AI Match Score</th>
                  <th className="px-6 py-3">Status Pipeline</th>
                  <th className="px-6 py-3 text-right">Aksi AI Screening</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((app) => {
                  const score = app.aiMatchScore != null ? Number(app.aiMatchScore) : null;
                  let parsedAnalysis: AIScreeningAnalysis | null = null;
                  if (app.aiAnalysis) {
                    if (typeof app.aiAnalysis === "object") {
                      parsedAnalysis = app.aiAnalysis as unknown as AIScreeningAnalysis;
                    } else {
                      try {
                        parsedAnalysis = JSON.parse(app.aiAnalysis);
                      } catch {
                        parsedAnalysis = {
                          applicantId: app.id,
                          applicantName: app.name,
                          vacancyTitle: app.vacancy?.title || "Lowongan",
                          matchScore: score != null ? score : 75,
                          grade: "SESUAI",
                          matchedSkills: [],
                          missingSkills: [],
                          strengths: ["Melampirkan data berkas CV & Surat Lamaran"],
                          areasOfConcern: [],
                          summary: String(app.aiAnalysis),
                          recommendation: "PROCEED_STAGE",
                        };
                      }
                    }
                  }

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {app.name}
                          {app.isBlacklisted && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                              Blacklist
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{app.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {app.vacancy?.title || "Lowongan Pekerjaan"}
                        </div>
                        <div className="text-xs text-slate-400">{app.vacancy?.department || "Umum"}</div>
                      </td>
                      <td className="px-6 py-4">
                        {score != null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                                score >= 80
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : score >= 50
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {score}%
                            </span>
                            {parsedAnalysis && (
                              <button
                                onClick={() => setSelectedAnalysis(parsedAnalysis)}
                                className="text-xs text-teal-600 underline hover:text-teal-800 dark:text-teal-400"
                              >
                                Lihat Laporan
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Belum di-screen</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRunAIScreening(app.id)}
                          disabled={screeningLoading === app.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                        >
                          <BrainCircuit
                            className={`h-3.5 w-3.5 ${
                              screeningLoading === app.id ? "animate-spin" : ""
                            }`}
                          />
                          {score != null ? "Re-Scan AI" : "Jalankan AI Screening"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Laporan AI Candidate Matching
                  </h3>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                    {selectedAnalysis.matchScore}% Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pelamar: <strong className="text-slate-700 dark:text-slate-200">{selectedAnalysis.applicantName}</strong> | Posisi: {selectedAnalysis.vacancyTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              {/* Executive Summary */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
                  Ringkasan Eksekutif AI
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedAnalysis.summary}
                </p>
              </div>

              {/* Matched & Missing Skills */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-400 text-xs flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4" /> Keahlian Cocok ({selectedAnalysis.matchedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAnalysis.matchedSkills.length > 0 ? (
                      selectedAnalysis.matchedSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Tidak ditemukan kecocokan kata kunci</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-400 text-xs flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4" /> Keahlian Belum Terdeteksi ({selectedAnalysis.missingSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAnalysis.missingSkills.length > 0 ? (
                      selectedAnalysis.missingSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 italic">Semua persyaratan utama terpenuhi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths & Concerns */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                  Poin Keunggulan & Catatan
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {selectedAnalysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <span>✓</span> {str}
                    </li>
                  ))}
                  {selectedAnalysis.areasOfConcern.map((con, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <span>•</span> {con}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl bg-teal-600 p-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Rekomendasi Tindakan ATS
                </div>
                <div className="mt-1 text-sm font-bold capitalize">
                  {selectedAnalysis.recommendation.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition dark:bg-slate-100 dark:text-slate-900"
              >
                Selesai & Tutup Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
