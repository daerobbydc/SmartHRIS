"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  ArrowRightLeft,
  Filter,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface ShiftSwap {
  id: string;
  requesterId: string;
  recipientId: string;
  requesterDate: string;
  recipientDate: string;
  reason: string | null;
  status: "PENDING_COLLEAGUE" | "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "CANCELLED";
  colleagueNote: string | null;
  managerNote: string | null;
  createdAt: string;
  requester: { firstName: string; lastName: string; department: string; position: string };
  recipient: { firstName: string; lastName: string; department: string; position: string };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

export default function ShiftSwapPage() {
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [formData, setFormData] = useState({
    recipientId: "",
    requesterDate: "",
    recipientDate: "",
    reason: "",
  });

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const [resSwaps, resEmps] = await Promise.all([
        fetch("/api/absensi/shift-swap"),
        fetch("/api/employees"),
      ]);

      if (resSwaps.ok) {
        const data = await resSwaps.json();
        setSwaps(data);
      }
      if (resEmps.ok) {
        const dataEmps = await resEmps.json();
        setEmployees(dataEmps.employees || dataEmps || []);
      }
    } catch (err) {
      console.error("Failed to load shift swaps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientId || !formData.requesterDate || !formData.recipientDate) return;

    try {
      // Assuming requester is first employee for demonstration if not logged in
      const requesterId = employees[0]?.id;

      const res = await fetch("/api/absensi/shift-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId,
          ...formData,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ recipientId: "", requesterDate: "", recipientDate: "", reason: "" });
        fetchSwaps();
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleColleagueRespond = async (requestId: string, accepted: boolean) => {
    try {
      const recipientId = employees[1]?.id || "";
      await fetch("/api/absensi/shift-swap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "COLLEAGUE_RESPOND",
          recipientId,
          accepted,
          note: accepted ? "Disetujui rekan sejawat" : "Tidak dapat bertukar jadwal",
        }),
      });
      fetchSwaps();
    } catch (err) {
      console.error("Respond error:", err);
    }
  };

  const handleManagerRespond = async (requestId: string, approved: boolean) => {
    try {
      await fetch("/api/absensi/shift-swap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "MANAGER_RESPOND",
          approved,
          note: approved ? "Disetujui oleh Supervisor/Manager" : "Ditolak oleh Manager",
        }),
      });
      fetchSwaps();
    } catch (err) {
      console.error("Manager respond error:", err);
    }
  };

  const filteredSwaps = swaps.filter((s) => statusFilter === "ALL" || s.status === statusFilter);

  const getStatusBadge = (status: ShiftSwap["status"]) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Disetujui Manager</span>;
      case "PENDING_MANAGER":
        return <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300"><Clock className="h-3 w-3" /> Menunggu Manager</span>;
      case "PENDING_COLLEAGUE":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300"><Clock className="h-3 w-3" /> Menunggu Rekan</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300"><XCircle className="h-3 w-3" /> Ditolak</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Shift Swap & Roster Exchange System
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Shift Exchange
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Fitur permohonan tukar shift antar karyawan dengan workflow persetujuan rekan sejawat & manager.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSwaps}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> Ajukan Tukar Shift
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3 dark:border-slate-800">
        {[
          { key: "ALL", label: "Semua Pengajuan" },
          { key: "PENDING_COLLEAGUE", label: "Menunggu Rekan" },
          { key: "PENDING_MANAGER", label: "Menunggu Manager" },
          { key: "APPROVED", label: "Disetujui" },
          { key: "REJECTED", label: "Ditolak" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === t.key
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
            Memuat pengajuan tukar shift...
          </div>
        ) : filteredSwaps.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Belum ada data tukar shift dalam kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Pemohon (Requester)</th>
                  <th className="px-6 py-3">Penerima (Recipient)</th>
                  <th className="px-6 py-3">Tgl Shift Pemohon</th>
                  <th className="px-6 py-3">Tgl Shift Penerima</th>
                  <th className="px-6 py-3">Status Workflow</th>
                  <th className="px-6 py-3 text-right">Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSwaps.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.requester.firstName} {item.requester.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{item.requester.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.recipient.firstName} {item.recipient.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{item.recipient.department}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {new Date(item.requesterDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {new Date(item.recipientDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "PENDING_COLLEAGUE" && (
                          <>
                            <button
                              onClick={() => handleColleagueRespond(item.id, true)}
                              className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition"
                            >
                              <Check className="h-3.5 w-3.5" /> Setujui Rekan
                            </button>
                            <button
                              onClick={() => handleColleagueRespond(item.id, false)}
                              className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                            >
                              <X className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </>
                        )}
                        {item.status === "PENDING_MANAGER" && (
                          <>
                            <button
                              onClick={() => handleManagerRespond(item.id, true)}
                              className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve Manager
                            </button>
                            <button
                              onClick={() => handleManagerRespond(item.id, false)}
                              className="inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
                            >
                              <X className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="text-xs text-slate-400 italic">Terjadwal di sistem</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Request */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Formulir Pengajuan Tukar Shift
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Rekan Sejawat (Tukar Dengan)
                </label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: emp.department,
                  }))}
                  value={formData.recipientId}
                  onChange={(val) => setFormData({ ...formData, recipientId: val })}
                  placeholder="-- Cari Rekan Sejawat --"
                  searchPlaceholder="Ketik nama rekan..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Shift Saya (Pemohon)
                </label>
                <input
                  type="date"
                  value={formData.requesterDate}
                  onChange={(e) => setFormData({ ...formData, requesterDate: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Shift Rekan (Penerima)
                </label>
                <input
                  type="date"
                  value={formData.recipientDate}
                  onChange={(e) => setFormData({ ...formData, recipientDate: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Tukar Shift
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ketik alasan pertukaran jadwal..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
