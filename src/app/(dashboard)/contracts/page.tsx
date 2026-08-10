"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Search, AlertTriangle, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Contract {
  id: string;
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate: string;
  position: string;
  salary: number;
  status: string;
  renewalCount: number;
  notes: string | null;
  employee: { id: string; firstName: string; lastName: string; department: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
  TERMINATED: "bg-gray-50 text-gray-700 border-gray-200",
  RENEWED: "bg-blue-50 text-blue-700 border-blue-200",
};

const typeLabels: Record<string, string> = {
  PKWT: "PKWT (Perjanjian Kerja Waktu Tertentu)",
  PKWTT: "PKWTT (Perjanjian Kerja Waktu Tidak Tertentu)",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showExpiring, setShowExpiring] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState<Contract | null>(null);
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string; position: string }[]>([]);

  const [formData, setFormData] = useState({
    employeeId: "",
    contractType: "PKWT",
    startDate: "",
    endDate: "",
    position: "",
    salary: "",
    notes: "",
  });

  const [renewData, setRenewData] = useState({ endDate: "", salary: "" });

  useEffect(() => {
    fetchContracts();
    fetchEmployees();
  }, [statusFilter, showExpiring]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (showExpiring) params.set("expiring", "true");

      const res = await fetch(`/api/contracts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, salary: parseFloat(formData.salary) }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ employeeId: "", contractType: "PKWT", startDate: "", endDate: "", position: "", salary: "", notes: "" });
        fetchContracts();
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRenewModal) return;

    try {
      const res = await fetch("/api/contracts/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: showRenewModal.id,
          newEndDate: renewData.endDate,
          newSalary: renewData.salary ? parseFloat(renewData.salary) : undefined,
        }),
      });

      if (res.ok) {
        setShowRenewModal(null);
        setRenewData({ endDate: "", salary: "" });
        fetchContracts();
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const getDaysUntilEnd = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const expiringContracts = contracts.filter((c) => {
    const days = getDaysUntilEnd(c.endDate);
    return c.status === "ACTIVE" && days <= 30 && days > 0;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contract Management</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Kelola kontrak kerja karyawan (PKWT/PKWTT).</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 shadow-md">
          <Plus className="h-4 w-4" /> Kontrak Baru
        </button>
      </div>

      {/* Expiring Alert */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{expiringContracts.length} kontrak akan berakhir dalam 30 hari</p>
              <p className="text-xs text-amber-600 mt-1">
                {expiringContracts.map((c) => `${c.employee.firstName} ${c.employee.lastName} (${getDaysUntilEnd(c.endDate)} hari)`).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Kontrak */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Total Kontrak
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {total}
            </span>
            <span className="text-xs font-semibold text-slate-400">Dokumen</span>
          </div>
        </div>

        {/* Aktif */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Kontrak Aktif
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {contracts.filter((c) => c.status === "ACTIVE").length}
            </span>
            <span className="text-xs font-semibold text-slate-400">Berjalan</span>
          </div>
        </div>

        {/* Akan Berakhir */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Akan Berakhir (&lt;30 Hari)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 font-mono">
              {expiringContracts.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">Perlu Review</span>
          </div>
        </div>

        {/* Expired */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Kontrak Expired
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-600 font-mono">
              {contracts.filter((c) => c.status === "EXPIRED").length}
            </span>
            <span className="text-xs font-semibold text-slate-400">Kadaluarsa</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchContracts()} placeholder="Cari karyawan atau posisi..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2.5">
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="EXPIRED">Expired</option>
            <option value="RENEWED">Diperpanjang</option>
            <option value="TERMINATED">Terminasi</option>
          </select>
          <button onClick={() => setShowExpiring(!showExpiring)} className={`px-4 py-2.5 text-xs font-semibold rounded-xl border ${showExpiring ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Clock className="h-4 w-4 inline mr-1" /> Akan Berakhir
          </button>
        </div>
      </div>

      {/* Contract Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Posisi</th>
                <th className="py-3.5 px-4">Periode</th>
                <th className="py-3.5 px-4">Gaji</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Tidak ada kontrak ditemukan</td></tr>
              ) : (
                contracts.map((contract) => {
                  const daysLeft = getDaysUntilEnd(contract.endDate);
                  return (
                    <tr key={contract.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900">{contract.employee.firstName} {contract.employee.lastName}</p>
                        <p className="text-[10px] text-gray-500">{contract.employee.department}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{typeLabels[contract.contractType] || contract.contractType}</td>
                      <td className="py-3.5 px-4 text-gray-600">{contract.position}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-gray-600">{new Date(contract.startDate).toLocaleDateString("id-ID")} - {new Date(contract.endDate).toLocaleDateString("id-ID")}</p>
                        {contract.status === "ACTIVE" && daysLeft <= 30 && (
                          <p className={`text-[10px] font-semibold ${daysLeft <= 7 ? "text-red-600" : "text-amber-600"}`}>
                            {daysLeft} hari lagi
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">Rp {contract.salary.toLocaleString("id-ID")}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${statusColors[contract.status] || ""}`}>
                          {contract.status}
                        </span>
                        {contract.renewalCount > 0 && (
                          <span className="ml-1 text-[10px] text-gray-500">#{contract.renewalCount + 1}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {contract.status === "ACTIVE" && (
                          <button onClick={() => setShowRenewModal(contract)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-[11px]">
                            <RefreshCw className="h-3 w-3 inline mr-1" /> Perpanjang
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Kontrak Baru</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Karyawan *</label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: emp.position || "Staff",
                  }))}
                  value={formData.employeeId}
                  onChange={(val) => {
                    const emp = employees.find((e) => e.id === val);
                    setFormData({ ...formData, employeeId: val, position: emp?.position || "" });
                  }}
                  placeholder="-- Cari Karyawan --"
                  searchPlaceholder="Ketik nama karyawan..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Kontrak *</label>
                <select value={formData.contractType} onChange={(e) => setFormData({ ...formData, contractType: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                  <option value="PKWT">PKWT</option>
                  <option value="PKWTT">PKWTT</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Posisi *</label>
                <input type="text" required value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Akhir *</label>
                  <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gaji *</label>
                <input type="number" required value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRenewModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Perpanjang Kontrak</h2>
            <p className="text-sm text-gray-500 mb-4">{showRenewModal.employee.firstName} {showRenewModal.employee.lastName}</p>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Akhir Baru *</label>
                <input type="date" required value={renewData.endDate} onChange={(e) => setRenewData({ ...renewData, endDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gaji Baru (opsional)</label>
                <input type="number" value={renewData.salary} onChange={(e) => setRenewData({ ...renewData, salary: e.target.value })} placeholder={`Saat ini: Rp ${showRenewModal.salary.toLocaleString("id-ID")}`} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRenewModal(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Perpanjang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
