"use client";

import { useState, useCallback } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ModernButton } from "@/components/ui";

interface ImportTemplate {
  key: string;
  name: string;
  description: string;
  headers: { key: string; label: string; required: boolean }[];
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount?: number;
  errorCount: number;
  errors: ImportError[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: string;
  title: string;
}

export function ImportModal({ isOpen, onClose, onSuccess, type, title }: ImportModalProps) {
  const [step, setStep] = useState<"select" | "upload" | "preview" | "result">("select");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/import?template=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `template-${type}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download template error:", error);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStep("preview");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep("preview");
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
      setStep("result");

      if (data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
      setResult({
        success: false,
        totalRows: 0,
        errorCount: 1,
        errors: [{ row: 0, message: "Gagal mengupload file" }],
      });
      setStep("result");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep("select");
    setFile(null);
    setResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">Import data dari file Excel/CSV</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step: Select */}
              {step === "select" && (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                    <p className="text-sm text-teal-700">
                      Download template Excel, isi data, lalu upload kembali.
                    </p>
                  </div>

                  <ModernButton
                    variant="secondary"
                    icon={<Download className="h-4 w-4" />}
                    onClick={handleDownloadTemplate}
                    className="w-full"
                  >
                    Download Template Excel
                  </ModernButton>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">atau</span>
                    </div>
                  </div>

                  <ModernButton
                    variant="primary"
                    icon={<Upload className="h-4 w-4" />}
                    onClick={() => setStep("upload")}
                    className="w-full"
                  >
                    Upload File Excel
                  </ModernButton>
                </div>
              )}

              {/* Step: Upload */}
              {step === "upload" && (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop file Excel/CSV ke sini
                  </p>
                  <p className="text-xs text-gray-400 mb-4">atau</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg cursor-pointer hover:bg-teal-600 transition-colors">
                    <FileSpreadsheet className="h-4 w-4" />
                    Pilih File
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-4">Format: .xlsx, .xls, .csv (maks 10MB)</p>
                </div>
              )}

              {/* Step: Preview */}
              {step === "preview" && file && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <FileSpreadsheet className="h-8 w-8 text-teal-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setStep("upload"); }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      Pastikan format file sesuai dengan template yang sudah didownload.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <ModernButton
                      variant="secondary"
                      onClick={() => setStep("upload")}
                      className="flex-1"
                    >
                      Kembali
                    </ModernButton>
                    <ModernButton
                      variant="primary"
                      onClick={handleImport}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengimport...
                        </>
                      ) : (
                        "Import Sekarang"
                      )}
                    </ModernButton>
                  </div>
                </div>
              )}

              {/* Step: Result */}
              {step === "result" && result && (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl">
                      <CheckCircle className="h-8 w-8 text-teal-600" />
                      <div>
                        <p className="font-semibold text-teal-700">Import Berhasil!</p>
                        <p className="text-sm text-teal-600">
                          {result.importedCount} dari {result.totalRows} data berhasil diimport
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl">
                      <AlertCircle className="h-8 w-8 text-rose-600" />
                      <div>
                        <p className="font-semibold text-rose-700">Import Gagal</p>
                        <p className="text-sm text-rose-600">
                          {result.errorCount} error ditemukan
                        </p>
                      </div>
                    </div>
                  )}

                  {result.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Baris</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {result.errors.map((err, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-600">{err.row}</td>
                              <td className="px-4 py-2 text-red-600">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <ModernButton
                    variant="primary"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Tutup
                  </ModernButton>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
