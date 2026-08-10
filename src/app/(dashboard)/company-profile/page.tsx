"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  FileSignature,
  DollarSign,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: "PT SmartHRIS Indonesia",
    code: "HO-JKT",
    address: "Jl. Teknologi No. 123, Jakarta Selatan, DKI Jakarta 12930",
    phone: "021-1234-5678",
    email: "info@smarthris.com",
    npwp: "12.345.678.9-012.000",
    bpjsKetenagakerjaan: "00123940129",
    bpjsKesehatan: "00018293019",
    hrDirectorName: "Budi Santoso, M.Psi",
    hrDirectorTitle: "Head of Human Capital Management",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
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
              Profil & Identitas Resmi Perusahaan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Building2 className="h-3.5 w-3.5" /> Company Profile
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pengaturan identitas legal perusahaan yang dicetak pada seluruh Kop Surat, Slip Gaji, Paklaring, & Kontrak Kerja.
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Pengaturan Berhasil Disimpan
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Form: Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="h-4 w-4 text-teal-600" /> Informasi Legalitas & Kontak Perusahaan
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Resmi Perusahaan (PT / CV) *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode / Singkatan Kantor Pusat *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.code}
                  onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Kantor Pusat (Tampil di Kop Surat) *
              </label>
              <textarea
                rows={2}
                required
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon Kantor
                </label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Resmi Perusahaan
                </label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NPWP Perusahaan
                </label>
                <input
                  type="text"
                  value={companyForm.npwp}
                  onChange={(e) => setCompanyForm({ ...companyForm, npwp: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode BPJS TK
                </label>
                <input
                  type="text"
                  value={companyForm.bpjsKetenagakerjaan}
                  onChange={(e) => setCompanyForm({ ...companyForm, bpjsKetenagakerjaan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode BPJS Kesehatan
                </label>
                <input
                  type="text"
                  value={companyForm.bpjsKesehatan}
                  onChange={(e) => setCompanyForm({ ...companyForm, bpjsKesehatan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FileSignature className="h-4 w-4 text-teal-600" /> Penandatangan Otomatis HRD (Default Signatory)
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pejabat HRD *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.hrDirectorName}
                  onChange={(e) => setCompanyForm({ ...companyForm, hrDirectorName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan Pejabat HRD *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.hrDirectorTitle}
                  onChange={(e) => setCompanyForm({ ...companyForm, hrDirectorTitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-3 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan Identitas Perusahaan"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info: Used Across Documents */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" /> Penerapan Nama Perusahaan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Nama dan identitas perusahaan yang Anda atur di halaman ini digunakan secara otomatis pada seluruh dokumen PDF resmi sistem:
            </p>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <FileText className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Surat Paklaring (E-Paklaring)</div>
                  <div className="text-[11px] text-slate-400">Dicetak di Kop Surat & Pernyataan Masa Kerja Karyawan</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <DollarSign className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Slip Gaji / Payroll PDF</div>
                  <div className="text-[11px] text-slate-400">Kop Slip Gaji & Rekapitulasi Pembayaran Gaji Karyawan</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <FileSignature className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Surat Perjanjian Kontrak Kerja</div>
                  <div className="text-[11px] text-slate-400">Pihak Pertama (Pemberi Kerja) pada Kontrak PKWT/PKWTT</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <ShieldCheck className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Laporan Presensi & Pelaporan BPJS</div>
                  <div className="text-[11px] text-slate-400">Kop Laporan Bulanan & Pendaftaran BPJS Kesehatan/TK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
