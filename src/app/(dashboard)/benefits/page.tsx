"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Activity,
  DollarSign,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Smile,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Benefit {
  id: string;
  name: string;
  description: string;
  type: string;
  coverage: string;
  premium: number;
  employerCoverage: number;
  employeeCoverage: number;
  isActive: boolean;
}

interface EmployeeBenefit {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitId: string;
  benefitName: string;
  startDate: string;
  endDate: string | null;
  status: string;
  premium: number;
  employerShare: number;
  employeeShare: number;
}

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeBenefits, setEmployeeBenefits] = useState<EmployeeBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "HEALTH",
    coverage: "STANDARD",
    premium: 0,
    employerCoverage: 80,
    employeeCoverage: 20,
  });

  const [enrollForm, setEnrollForm] = useState({
    benefitId: "",
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchBenefits();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeBenefits();
    }
  }, [selectedEmployee]);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefits");
      const data = await res.json();
      setBenefits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      const data = await res.json();
      const emps = data.employees || data || [];
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmployee) {
        setSelectedEmployee(emps[0].id);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchEmployeeBenefits = async () => {
    try {
      const res = await fetch(`/api/benefits?employeeId=${selectedEmployee}`);
      const data = await res.json();
      setEmployeeBenefits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowDialog(false);
      resetForm();
      fetchBenefits();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enroll",
          employeeId: selectedEmployee,
          benefitId: enrollForm.benefitId,
          startDate: enrollForm.startDate,
        }),
      });
      setShowEnrollDialog(false);
      setEnrollForm({
        benefitId: "",
        startDate: new Date().toISOString().slice(0, 10),
      });
      fetchEmployeeBenefits();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleTerminate = async (id: string) => {
    if (!confirm("Terminasi pendaftaran benefit ini?")) return;
    try {
      await fetch(`/api/benefits?id=${id}&action=terminate`, {
        method: "PUT",
      });
      fetchEmployeeBenefits();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      type: "HEALTH",
      coverage: "STANDARD",
      premium: 0,
      employerCoverage: 80,
      employeeCoverage: 20,
    });
    setEditingBenefit(null);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      HEALTH: "BPJS / Asuransi Kesehatan",
      LIFE: "Asuransi Jiwa",
      DENTAL: "Manfaat Kesehatan Gigi",
      VISION: "Manfaat Optik & Kacamata",
      DISABILITY: "Jaminan Kecelakaan Kerja",
      RETIREMENT: "Jaminan Pensiun & Hari Tua",
      OTHER: "Tunjangan Lainnya",
    };
    return types[type] || type;
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "HEALTH":
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300";
      case "LIFE":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300";
      case "RETIREMENT":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      case "DISABILITY":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
    }
  };

  const currentEmp = employees.find((e) => e.id === selectedEmployee);

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
              Manfaat Karyawan & Asuransi Kesehatan
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Employee Benefits
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola paket asuransi kesehatan, BPJS Ketenagakerjaan, jaminan pensiun, dan pendaftaran benefit karyawan.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" /> Tambah Program Benefit
        </button>
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Program Manfaat Aktif</span>
            <Shield className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white font-mono">
            {benefits.length} <span className="text-xs font-normal text-slate-400">Program</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Pendaftaran Karyawan</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 font-mono">
            {employeeBenefits.filter((eb) => eb.status === "ACTIVE").length}{" "}
            <span className="text-xs font-normal text-slate-400">Terdaftar</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 uppercase tracking-wider">
            <span>Cakupan Asuransi Karyawan</span>
            <Sparkles className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-cyan-600 font-mono">
            100% <span className="text-xs font-normal text-slate-400">Proteksi Kesehatan</span>
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Program Benefit Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Program Benefit Perusahaan
                </h2>
                <p className="text-xs text-slate-400">
                  Paket asuransi dan subsidi tunjangan yang tersedia untuk karyawan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3.5">Nama Program</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5">Iuran / Bulan</th>
                    <th className="px-6 py-3.5">Subsidi Kantor</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Memuat program benefit...
                      </td>
                    </tr>
                  ) : benefits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Belum ada program benefit. Klik <strong>Tambah Program Benefit</strong> di atas.
                      </td>
                    </tr>
                  ) : (
                    benefits.map((benefit) => (
                      <tr key={benefit.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-teal-600" />
                            {benefit.name}
                          </div>
                          {benefit.description && (
                            <p className="text-[11px] font-normal text-slate-400 mt-0.5">
                              {benefit.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${getTypeBadgeClass(benefit.type)}`}>
                            {getTypeLabel(benefit.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white font-mono">
                          Rp {benefit.premium.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          {benefit.employerCoverage}% Perusahaan / {benefit.employeeCoverage}% Karyawan
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setEditingBenefit(benefit);
                              setForm({
                                name: benefit.name,
                                description: benefit.description,
                                type: benefit.type,
                                coverage: benefit.coverage,
                                premium: benefit.premium,
                                employerCoverage: benefit.employerCoverage,
                                employeeCoverage: benefit.employeeCoverage,
                              });
                              setShowDialog(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 transition"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Employee Enrollment */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-teal-600" /> Enrollment Karyawan
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Karyawan
              </label>
              <AutocompleteSelect
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                  sublabel: emp.position || "Staff",
                }))}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                placeholder="-- Pilih Karyawan --"
                searchPlaceholder="Ketik nama karyawan..."
              />
            </div>

            {selectedEmployee && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowEnrollDialog(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  <UserPlus className="h-4 w-4" /> Enroll Benefit Karyawan
                </button>

                {employeeBenefits.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Karyawan ini belum terdaftar di program benefit manapun.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {employeeBenefits.map((eb) => (
                      <div
                        key={eb.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {eb.benefitName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                              eb.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {eb.status === "ACTIVE" ? "Aktif" : "Non-Aktif"}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Mulai Terdaftar:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(eb.startDate).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Iuran Bulanan:</span>
                            <span className="font-bold text-teal-600 font-mono">
                              Rp {eb.premium.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {eb.status === "ACTIVE" && (
                          <button
                            onClick={() => handleTerminate(eb.id)}
                            className="w-full mt-2 rounded-lg border border-rose-200 bg-rose-50 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                          >
                            Terminasi Pendaftaran
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Benefit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingBenefit ? "Edit Program Benefit" : "Tambah Program Benefit Baru"}
              </h3>
              <button onClick={() => setShowDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBenefit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Program Benefit *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: BPJS Kesehatan / Asuransi Inhealth"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Manfaat
                </label>
                <AutocompleteSelect
                  options={[
                    { value: "HEALTH", label: "BPJS / Asuransi Kesehatan", sublabel: "Rawat inap & jalan" },
                    { value: "LIFE", label: "Asuransi Jiwa", sublabel: "Santunan kematian & duka" },
                    { value: "DENTAL", label: "Manfaat Kesehatan Gigi", sublabel: "Pemeriksaan & perawatan gigi" },
                    { value: "VISION", label: "Manfaat Optik & Kacamata", sublabel: "Subsidi lensa & bingkai" },
                    { value: "DISABILITY", label: "Jaminan Kecelakaan Kerja", sublabel: "JKK BPJS Ketenagakerjaan" },
                    { value: "RETIREMENT", label: "Jaminan Pensiun & Hari Tua", sublabel: "JHT & JP BPJS TK" },
                    { value: "OTHER", label: "Tunjangan Lainnya", sublabel: "Tunjangan transportasi / makan" },
                  ]}
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  placeholder="-- Pilih Kategori --"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Besar Iuran Premium Bulanan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={form.premium}
                  onChange={(e) => setForm({ ...form, premium: parseInt(e.target.value) || 0 })}
                  placeholder="500000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subsidi Perusahaan (%)
                  </label>
                  <input
                    type="number"
                    value={form.employerCoverage}
                    onChange={(e) => setForm({ ...form, employerCoverage: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Beban Karyawan (%)
                  </label>
                  <input
                    type="number"
                    value={form.employeeCoverage}
                    onChange={(e) => setForm({ ...form, employeeCoverage: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Catatan Manfaat
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tuliskan detail fasilitas rawat jalan / klaim..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  {editingBenefit ? "Simpan Perubahan" : "Buat Program Benefit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Dialog */}
      {showEnrollDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Enroll Benefit Karyawan
              </h3>
              <button onClick={() => setShowEnrollDialog(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Program Benefit
                </label>
                <AutocompleteSelect
                  options={benefits.map((b) => ({
                    value: b.id,
                    label: b.name,
                    sublabel: `Rp ${b.premium.toLocaleString("id-ID")}/bulan (${b.employerCoverage}% subsidi)`,
                  }))}
                  value={enrollForm.benefitId}
                  onChange={(val) => setEnrollForm({ ...enrollForm, benefitId: val })}
                  placeholder="-- Pilih Program Benefit --"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Efektif Mulai
                </label>
                <input
                  type="date"
                  required
                  value={enrollForm.startDate}
                  onChange={(e) => setEnrollForm({ ...enrollForm, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEnrollDialog(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                >
                  Simpan Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
