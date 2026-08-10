"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  FolderKanban,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  Search,
  Sparkles,
  User,
  HardDrive,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
}

export default function DocumentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchDocuments();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const emps = data.employees || data || [];
        setEmployees(emps);
        if (emps.length > 0 && !selectedEmployee) {
          setSelectedEmployee(emps[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/personalia/documents?employeeId=${selectedEmployee}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmployee) return;

    setUploading(true);
    try {
      const fileUrl = `/uploads/${file.name}`;

      await fetch("/api/personalia/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          name: file.name,
          type: file.type || "application/octet-stream",
          fileUrl,
          fileSize: file.size,
        }),
      });

      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas dokumen ini?")) return;

    await fetch(`/api/personalia/documents?id=${id}`, {
      method: "DELETE",
    });
    fetchDocuments();
  };

  const getDocumentIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-6 w-6 text-rose-500" />;
    if (type.includes("image")) return <ImageIcon className="h-6 w-6 text-teal-500" />;
    if (type.includes("word") || type.includes("document")) return <FileText className="h-6 w-6 text-cyan-500" />;
    if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="h-6 w-6 text-emerald-500" />;
    return <FileCode className="h-6 w-6 text-slate-400" />;
  };

  const getDocumentIconBg = (type: string) => {
    if (type.includes("pdf")) return "bg-rose-50 border-rose-100 dark:bg-rose-950/50 dark:border-rose-900";
    if (type.includes("image")) return "bg-teal-50 border-teal-100 dark:bg-teal-950/50 dark:border-teal-900";
    if (type.includes("word") || type.includes("document")) return "bg-cyan-50 border-cyan-100 dark:bg-cyan-950/50 dark:border-cyan-900";
    if (type.includes("sheet") || type.includes("excel")) return "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-900";
    return "bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700";
  };

  const currentEmp = employees.find((e) => e.id === selectedEmployee);

  const filteredDocs = documents.filter((doc) => {
    if (filterType === "PDF") return doc.type.includes("pdf");
    if (filterType === "IMG") return doc.type.includes("image");
    if (filterType === "DOC") return doc.type.includes("word") || doc.type.includes("document");
    return true;
  });

  const totalSizeMB = (
    documents.reduce((acc, d) => acc + (d.fileSize || 0), 0) /
    (1024 * 1024)
  ).toFixed(2);

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
              Dokumen & Berkas Personalia Karyawan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <FolderKanban className="h-3.5 w-3.5" /> Arsip Digital HR
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola penyimpanan berkas KTP, Ijazah, Kontrak Kerja, Sertifikat, dan Dokumen resmi karyawan.
          </p>
        </div>
      </div>

      {/* Employee Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-teal-600" /> Pilih Karyawan Pemilik Dokumen
            </label>
            <AutocompleteSelect
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}`,
                sublabel: `${emp.department || "General"} • ${emp.position || "Staff"}`,
              }))}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="-- Cari Nama Karyawan --"
              searchPlaceholder="Ketik nama karyawan..."
            />
          </div>

          {currentEmp && (
            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3 dark:border-teal-900/40 dark:bg-teal-950/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {currentEmp.firstName[0]}
                {currentEmp.lastName[0]}
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {currentEmp.firstName} {currentEmp.lastName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentEmp.department} • NIK: {currentEmp.employeeId || "EMP-001"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <div className="space-y-6">
          {/* Stat Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
                <span>Total Dokumen Tersimpan</span>
                <FileCheck className="h-4 w-4 text-teal-500" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {documents.length} <span className="text-xs font-normal text-slate-400">Berkas</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase tracking-wider">
                <span>Total Ukuran File</span>
                <HardDrive className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="mt-3 text-3xl font-black text-cyan-600">
                {totalSizeMB} <span className="text-xs font-normal text-slate-400">MB</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <span>Format Dokumen PDF / Foto</span>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {documents.filter((d) => d.type.includes("pdf") || d.type.includes("image")).length}{" "}
                <span className="text-xs font-normal text-slate-400">Dokumen Digital</span>
              </p>
            </div>
          </div>

          {/* Upload Dropzone Box */}
          <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/40 p-6 text-center dark:border-teal-800/80 dark:bg-teal-950/20">
            <Upload className="mx-auto h-10 w-10 text-teal-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Unggah Berkas Dokumen Karyawan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Format yang didukung: <strong>PDF, DOC, DOCX, JPG, PNG</strong> (Maksimal ukuran file 10MB).
            </p>

            <div className="mt-4">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                <Upload className="h-4 w-4" />
                {uploading ? "Mengunggah Berkas..." : "Pilih File dari Perangkat"}
              </label>
            </div>
          </div>

          {/* Documents Table & Filter Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Arsip Dokumen ({filteredDocs.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Daftar seluruh berkas yang terhubung dengan akun karyawan.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {["ALL", "PDF", "IMG", "DOC"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      filterType === t
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {t === "ALL" ? "Semua File" : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  Memuat daftar dokumen...
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  Belum ada dokumen yang diunggah untuk kategori ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AnimatePresence>
                    {filteredDocs.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 transition group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${getDocumentIconBg(doc.type)} shadow-xs`}>
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition">
                              {doc.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {doc.fileSize
                                ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                                : "Unknown Size"}{" "}
                              • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 transition"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={doc.fileUrl}
                            download
                            className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 transition"
                            title="Unduh File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
