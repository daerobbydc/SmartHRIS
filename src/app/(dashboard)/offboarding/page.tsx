"use client";

import { useState, useEffect } from "react";
import {
  UserMinus,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Building2,
  FileCheck,
  AlertTriangle,
  Settings,
  Printer,
} from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  position: string;
  hireDate: string;
  status: string;
}

export default function OffboardingPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Customization Modal State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    companyName: "PT SmartHRIS Indonesia",
    documentNumber: "SKK/HRD/SMARTHRIS/2026/8900",
    hrSignName: "Budi Santoso, M.Psi",
    hrSignTitle: "Head of Human Capital Management",
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || data || []);
      }
    } catch (err) {
      console.error("Failed to load offboarding employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCustomModal = async (emp: Employee) => {
    setSelectedEmp(emp);

    let compName = "PT SmartHRIS Indonesia";
    let hrName = "Budi Santoso, M.Psi";
    let hrTitle = "Head of Human Capital Management";

    try {
      const res = await fetch("/api/company-profile");
      if (res.ok) {
        const comp = await res.json();
        if (comp.name) compName = comp.name;
        if (comp.hrSignName) hrName = comp.hrSignName;
        if (comp.hrSignTitle) hrTitle = comp.hrSignTitle;
      }
    } catch (e) {
      console.error("Error fetching company profile:", e);
    }

    const code = compName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "SMARTHRIS";
    setCustomForm({
      companyName: compName,
      documentNumber: `SKK/HRD/${code}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      hrSignName: hrName,
      hrSignTitle: hrTitle,
    });
    setShowConfigModal(true);
  };

  const handleDownloadPaklaring = async (empId?: string, name?: string) => {
    const targetId = empId || selectedEmp?.id;
    const targetName = name || `${selectedEmp?.firstName} ${selectedEmp?.lastName}`;

    if (!targetId) return;

    setDownloadingId(targetId);
    try {
      const params = new URLSearchParams({
        employeeId: targetId,
        companyName: customForm.companyName,
        documentNumber: customForm.documentNumber,
        hrSignName: customForm.hrSignName,
        hrSignTitle: customForm.hrSignTitle,
      });

      const res = await fetch(`/api/offboarding/paklaring?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal mengunduh Surat Paklaring PDF" }));
        alert(err.error || "Gagal mengunduh Paklaring PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat_Paklaring_${targetName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowConfigModal(false);
    } catch (error) {
      console.error("Paklaring download error:", error);
      alert("Terjadi kesalahan saat mengunduh Paklaring PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Offboarding Automation & E-Paklaring Generator
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <UserMinus className="h-3.5 w-3.5" /> Offboarding Workflow
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manajemen *exit interview*, *clearance checklist* (pengembalian aset, serah terima tugas), serta penerbitan otomatis Surat Keterangan Kerja (Paklaring) PDF.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Main Employee Clearance List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daftar Karyawan Transisi & Offboarding
          </h2>
          <span className="text-xs font-medium text-slate-500">Otomatisasi Penerbitan Dokumen Resmi</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
            Memuat data offboarding...
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Tidak ada karyawan dalam daftar transisi offboarding.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3.5">Nama Karyawan</th>
                  <th className="px-6 py-3.5">Posisi & Dept</th>
                  <th className="px-6 py-3.5">Status Clearance</th>
                  <th className="px-6 py-3.5">Masa Kerja (Tenure)</th>
                  <th className="px-6 py-3.5 text-right">Generator E-Paklaring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.slice(0, 10).map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {emp.firstName} {emp.lastName}
                      <div className="text-[11px] font-normal text-slate-400">NIK: {emp.employeeId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{emp.position}</div>
                      <div className="text-[11px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Clearance Complete
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {new Date(emp.hireDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - Sekarang
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCustomModal(emp)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
                          title="Kustomisasi Format Surat & Penandatangan"
                        >
                          <Settings className="h-3.5 w-3.5 text-teal-600" /> Kustomisasi Paklaring
                        </button>
                        <button
                          onClick={() => handleDownloadPaklaring(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          disabled={downloadingId === emp.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloadingId === emp.id ? "Mengunduh..." : "Paklaring Instant"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paklaring Customization Modal */}
      {showConfigModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Kustomisasi E-Paklaring PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atur nama PT, format nomor surat, & penandatangan HRD untuk {selectedEmp.firstName} {selectedEmp.lastName}.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDownloadPaklaring();
              }}
              className="mt-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Perusahaan (Kop & Badan Surat) *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.companyName}
                  onChange={(e) => setCustomForm({ ...customForm, companyName: e.target.value })}
                  placeholder="Contoh: PT Nusantara Jaya Utama"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Surat Keterangan Kerja *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.documentNumber}
                  onChange={(e) => setCustomForm({ ...customForm, documentNumber: e.target.value })}
                  placeholder="Contoh: SKK/HRD/SMARTHRIS/2026/8900"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penandatangan HRD *
                  </label>
                  <input
                    type="text"
                    required
                    value={customForm.hrSignName}
                    onChange={(e) => setCustomForm({ ...customForm, hrSignName: e.target.value })}
                    placeholder="Contoh: Budi Santoso, M.Psi"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Penandatangan HRD *
                  </label>
                  <input
                    type="text"
                    required
                    value={customForm.hrSignTitle}
                    onChange={(e) => setCustomForm({ ...customForm, hrSignTitle: e.target.value })}
                    placeholder="Contoh: Head of Human Capital Management"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-teal-50/70 p-3 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300">
                <strong>Pratinjau Format:</strong> Surat akan diterbitkan atas nama <strong>{customForm.companyName}</strong> dengan nomor <code>{customForm.documentNumber}</code> dan ditandatangani oleh <strong>{customForm.hrSignName}</strong> ({customForm.hrSignTitle}).
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={downloadingId === selectedEmp.id}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingId === selectedEmp.id ? "Mengunduh PDF..." : "Unduh Custom Paklaring PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
