"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Calculator,
  Download,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  FileText,
  Users,
  Search,
  Filter,
  Plus,
  Building2,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface PayrollItem {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  allowance: number;
  deduction: number;
  tax: number;
  overtime: number;
  bonus: number;
  thr: number;
  pph21: number;
  grossIncome: number;
  bpjsJhtEmployee: number;
  bpjsJpEmployee: number;
  bpjsKesehatanEmployee: number;
  totalDeduction: number;
  netSalary: number;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  };
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching payrolls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessBulkPayroll = async () => {
    if (!confirm(`Jalankan proses otomatisasi hitung Gaji Bulanan untuk ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}?`)) return;

    setProcessing(true);
    try {
      const empRes = await fetch("/api/employees?limit=100");
      const empData = await empRes.json();
      const emps = empData.employees || [];

      for (const emp of emps) {
        await fetch("/api/payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: emp.id,
            month: selectedMonth,
            year: selectedYear,
            allowance: 1000000,
            overtime: 350000,
            deduction: 0,
          }),
        });
      }

      fetchPayrolls();
    } catch (error) {
      console.error("Error processing bulk payroll:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPayslip = async (payroll: PayrollItem) => {
    try {
      const res = await fetch(
        `/api/payroll/export?employeeId=${payroll.employee?.employeeId}&month=${payroll.month}&year=${payroll.year}`
      );

      if (!res.ok) {
        alert("Gagal mengunduh Slip Gaji PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Slip_Gaji_${payroll.employee.firstName}_${payroll.employee.lastName}_${selectedMonth}_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Terjadi kesalahan saat mengunduh Slip Gaji");
    }
  };

  const filteredPayrolls = payrolls.filter((p) => {
    const fullName = `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) || p.employee.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || p.employee.department === deptFilter;
    return matchSearch && matchDept;
  });

  const totalNetSalary = filteredPayrolls.reduce((acc, p) => acc + p.netSalary, 0);
  const totalPPh21 = filteredPayrolls.reduce((acc, p) => acc + (p.pph21 || p.tax || 0), 0);
  const totalBPJS = filteredPayrolls.reduce(
    (acc, p) => acc + (p.bpjsJhtEmployee || 0) + (p.bpjsJpEmployee || 0) + (p.bpjsKesehatanEmployee || 0),
    0
  );

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
              Penggajian Bulanan & Slip Gaji PDF
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <DollarSign className="h-3.5 w-3.5" /> Automated Payroll TER
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Perhitungan otomatis Gaji Pokok, Tunjangan, Overtime, BPJS TK/Kes, dan PPh 21 Tarif Efektif Rata-Rata (TER).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/payroll/components"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 transition"
          >
            Komponen Gaji
          </a>
          <button
            onClick={handleProcessBulkPayroll}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:from-teal-700 hover:to-teal-800 active:scale-95 transition disabled:opacity-50"
          >
            <Calculator className={`h-4 w-4 ${processing ? "animate-spin" : ""}`} />
            {processing ? "Memproses Gaji..." : "Proses Gaji Bulanan Instant"}
          </button>
        </div>
      </div>

      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Total Pengeluaran Net Gaji</span>
            <DollarSign className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalNetSalary)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase tracking-wider">
            <span>Total Potongan PPh 21 TER</span>
            <FileText className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-rose-600 font-mono">
            {formatCurrency(totalPPh21)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Total Potongan BPJS TK/Kes</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600 font-mono">
            {formatCurrency(totalBPJS)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIK atau Nama Karyawan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Menampilkan {filteredPayrolls.length} Slip Gaji Karyawan
        </span>
      </div>

      {/* Main Payroll Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daftar Gaji Karyawan Periode {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </h2>
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
            Terbaca Otomatis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3.5">Karyawan</th>
                <th className="px-6 py-3.5">Gaji Pokok</th>
                <th className="px-6 py-3.5">Tunjangan & Lembur</th>
                <th className="px-6 py-3.5">PPh 21 TER</th>
                <th className="px-6 py-3.5">Potongan BPJS</th>
                <th className="px-6 py-3.5 font-black">Gaji Bersih (Net)</th>
                <th className="px-6 py-3.5 text-right">Slip Gaji PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Memuat data penggajian...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Belum ada data gaji untuk periode ini. Klik <strong>Proses Gaji Bulanan Instant</strong> di atas.
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {payroll.employee.firstName} {payroll.employee.lastName}
                      <div className="text-[11px] font-normal text-slate-400">
                        {payroll.employee.department} • NIK: {payroll.employee.employeeId}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(payroll.baseSalary)}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-600 font-semibold">
                      +{formatCurrency((payroll.allowance || 0) + (payroll.overtime || 0))}
                    </td>
                    <td className="px-6 py-4 font-mono text-rose-600 font-semibold">
                      -{formatCurrency(payroll.pph21 || payroll.tax || 0)}
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-600 font-semibold">
                      -{formatCurrency((payroll.bpjsJhtEmployee || 0) + (payroll.bpjsJpEmployee || 0) + (payroll.bpjsKesehatanEmployee || 0))}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(payroll.netSalary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadPayslip(payroll)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-800 transition"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh Slip Gaji PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
