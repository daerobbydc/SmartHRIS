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
  Image as ImageIcon,
  Upload,
  Trash2,
  Info,
} from "lucide-react";

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    letterheadLogo: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/company-profile");
      if (res.ok) {
        const data = await res.json();
        setCompanyForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          code: data.code || prev.code,
          address: data.address || prev.address,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          npwp: data.npwp || prev.npwp,
          bpjsKetenagakerjaan: data.bpjsKetenagakerjaan || prev.bpjsKetenagakerjaan,
          bpjsKesehatan: data.bpjsKesehatan || prev.bpjsKesehatan,
          hrDirectorName: data.hrSignName || prev.hrDirectorName,
          hrDirectorTitle: data.hrSignTitle || prev.hrDirectorTitle,
          letterheadLogo: data.letterheadLogo || prev.letterheadLogo,
        }));
      }
    } catch (err) {
      console.error("Error fetching company profile:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file gambar maksimal 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCompanyForm((prev) => ({ ...prev, letterheadLogo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCompanyForm((prev) => ({ ...prev, letterheadLogo: "" }));
  };

  const generateSampleLetterhead = () => {
    // Generate a sleek SVG data URI letterhead for demonstration
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 0);
      grad.addColorStop(0, "#0f766e");
      grad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 180);

      // Logo Icon Circle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(80, 90, 45, 0, Math.PI * 2);
      ctx.fill();

      // Inner Icon Text
      ctx.fillStyle = "#0f766e";
      ctx.font = "bold 38px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HR", 80, 92);

      // Company Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px Arial";
      ctx.textAlign = "left";
      ctx.fillText(companyForm.name.toUpperCase(), 150, 70);

      // Subtitle details
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "20px Arial";
      ctx.fillText(`${companyForm.address} | Telp: ${companyForm.phone} | Email: ${companyForm.email}`, 150, 115);

      // Gold Accent Bar at bottom
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(0, 168, 1200, 12);

      const base64 = canvas.toDataURL("image/png");
      setCompanyForm((prev) => ({ ...prev, letterheadLogo: base64 }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/company-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyForm.name,
          code: companyForm.code,
          address: companyForm.address,
          phone: companyForm.phone,
          email: companyForm.email,
          npwp: companyForm.npwp,
          bpjsKetenagakerjaan: companyForm.bpjsKetenagakerjaan,
          bpjsKesehatan: companyForm.bpjsKesehatan,
          hrSignName: companyForm.hrDirectorName,
          hrSignTitle: companyForm.hrDirectorTitle,
          letterheadLogo: companyForm.letterheadLogo,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Gagal menyimpan profil perusahaan.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
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
              Profil & Gambar Kop Perusahaan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Building2 className="h-3.5 w-3.5" /> Company Settings
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pengaturan identitas resmi & Gambar Kop Surat yang otomatis dicetak pada seluruh dokumen PDF (Slip Gaji, Paklaring, Kontrak Kerja, & SP).
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Pengaturan & Kop Berhasil Disimpan
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Form: Profile Settings & Letterhead Image Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Gambar Kop Perusahaan */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-teal-600" /> Gambar Kop Surat Perusahaan (Company Letterhead)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gambar ini akan dicetak di bagian paling atas seluruh laporan PDF (Slip Gaji, Paklaring, Kontrak, & SP).
                </p>
              </div>
              <button
                type="button"
                onClick={generateSampleLetterhead}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition"
              >
                + Contoh Kop Demo
              </button>
            </div>

            {companyForm.letterheadLogo ? (
              <div className="space-y-3">
                <div className="border border-teal-200 rounded-2xl p-3 bg-slate-900 flex flex-col items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyForm.letterheadLogo}
                    alt="Kop Perusahaan"
                    className="max-h-24 object-contain w-full rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Gambar Kop Aktif & Siap Dicetak pada PDF
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus Kop
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                <Upload className="h-8 w-8 text-teal-600 mx-auto" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Unggah Gambar Kop Perusahaan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Format PNG / JPG / WebP (Ukuran rekomendasi: 1200 x 180 px)</p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm">
                  <Upload className="h-4 w-4" /> Pilih File Gambar Kop
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

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
                {loading ? "Menyimpan..." : "Simpan Profil & Gambar Kop Perusahaan"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info: Used Across Documents */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" /> Dokumen PDF Ber-Kop Surat
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gambar Kop Perusahaan yang diunggah otomatis akan dicetak pada seluruh dokumen PDF resmi sistem:
            </p>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <DollarSign className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Slip Gaji / Payroll PDF</div>
                  <div className="text-[11px] text-slate-400">Dicetak di bagian atas Slip Gaji Karyawan</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <FileText className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Surat Paklaring (E-Paklaring PDF)</div>
                  <div className="text-[11px] text-slate-400">Kop Surat Keterangan Kerja Resmi</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <FileSignature className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Surat Perjanjian Kontrak Kerja</div>
                  <div className="text-[11px] text-slate-400">Kop Perjanjian Kerja PKWT & PKWTT PDF</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Surat Peringatan (SP 1, SP 2, SP 3)</div>
                  <div className="text-[11px] text-slate-400">Kop Surat Sanksi Disiplin & Pelanggaran Karyawan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
