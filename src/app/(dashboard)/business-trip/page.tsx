"use client";

import { useState, useEffect } from "react";
import {
  Plane,
  Plus,
  RefreshCw,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  FileText,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface Settlement {
  id: string;
  totalReceipts: number;
  advanceAmount: number;
  differenceAmount: number;
  status: string;
}

interface BusinessTrip {
  id: string;
  employeeId: string;
  title: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  cashAdvanceAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SETTLED" | "CANCELLED";
  rejectionReason: string | null;
  createdAt: string;
  employee: { firstName: string; lastName: string; department: string; position: string };
  settlements: Settlement[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

export default function BusinessTripPage() {
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState<BusinessTrip | null>(null);

  const [tripForm, setTripForm] = useState({
    employeeId: "",
    title: "",
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    estimatedBudget: 0,
    cashAdvanceAmount: 0,
  });

  const [settlementForm, setSettlementForm] = useState({
    totalReceipts: 0,
    receiptUrls: "",
    notes: "",
  });

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const [resTrips, resEmps] = await Promise.all([
        fetch("/api/business-trip"),
        fetch("/api/employees"),
      ]);

      if (resTrips.ok) {
        const data = await resTrips.json();
        setTrips(data);
      }
      if (resEmps.ok) {
        const dataEmps = await resEmps.json();
        setEmployees(dataEmps.employees || dataEmps || []);
      }
    } catch (err) {
      console.error("Failed to load business trips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/business-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripForm),
      });

      if (res.ok) {
        setShowTripModal(false);
        setTripForm({
          employeeId: "",
          title: "",
          destination: "",
          purpose: "",
          startDate: "",
          endDate: "",
          estimatedBudget: 0,
          cashAdvanceAmount: 0,
        });
        fetchTrips();
      }
    } catch (err) {
      console.error("Create trip error:", err);
    }
  };

  const handleApproveTrip = async (tripId: string, approved: boolean) => {
    try {
      await fetch("/api/business-trip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, approved }),
      });
      fetchTrips();
    } catch (err) {
      console.error("Approve trip error:", err);
    }
  };

  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSettlementModal) return;

    try {
      const res = await fetch("/api/business-trip/settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessTripId: showSettlementModal.id,
          employeeId: showSettlementModal.employeeId,
          totalReceipts: settlementForm.totalReceipts,
          advanceAmount: showSettlementModal.cashAdvanceAmount,
          receiptUrls: settlementForm.receiptUrls,
          notes: settlementForm.notes,
        }),
      });

      if (res.ok) {
        setShowSettlementModal(null);
        setSettlementForm({ totalReceipts: 0, receiptUrls: "", notes: "" });
        fetchTrips();
      }
    } catch (err) {
      console.error("Submit settlement error:", err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Perjalanan Dinas & Cash Advance Settlement
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Plane className="h-3.5 w-3.5" /> Business Trip
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pengajuan perjalanan dinas, permohonan uang muka (*cash advance*), serta pertanggungjawaban realisasi biaya.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTrips}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowTripModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> Ajukan Perjalanan Dinas
          </button>
        </div>
      </div>

      {/* Main Trips List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-500 mb-2" />
            Memuat data perjalanan dinas...
          </div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Belum ada permohonan perjalanan dinas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Nama Karyawan</th>
                  <th className="px-6 py-3">Agenda & Destinasi</th>
                  <th className="px-6 py-3">Periode Tanggal</th>
                  <th className="px-6 py-3">Uang Muka (Advance)</th>
                  <th className="px-6 py-3">Status Trip</th>
                  <th className="px-6 py-3 text-right">Aksi & Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trips.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.employee.firstName} {item.employee.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{item.employee.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {new Date(item.startDate).toLocaleDateString("id-ID", { dateStyle: "short" })} -{" "}
                      {new Date(item.endDate).toLocaleDateString("id-ID", { dateStyle: "short" })}
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-700 dark:text-teal-400">
                      Rp {Number(item.cashAdvanceAmount).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.status === "SETTLED"
                            ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                            : item.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApproveTrip(item.id, true)}
                              className="rounded bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveTrip(item.id, false)}
                              className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {item.status === "APPROVED" && (
                          <button
                            onClick={() => setShowSettlementModal(item)}
                            className="inline-flex items-center gap-1 rounded bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                          >
                            <FileCheck className="h-3.5 w-3.5" /> Klaim Settlement
                          </button>
                        )}
                        {item.status === "SETTLED" && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Terrealisasi
                          </span>
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

      {/* New Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pengajuan Perjalanan Dinas Baru
              </h3>
              <button onClick={() => setShowTripModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Karyawan Pemohon
                </label>
                <AutocompleteSelect
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                    sublabel: emp.department,
                  }))}
                  value={tripForm.employeeId}
                  onChange={(val) => setTripForm({ ...tripForm, employeeId: val })}
                  placeholder="-- Cari Karyawan Pemohon --"
                  searchPlaceholder="Ketik nama karyawan..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Perjalanan / Agenda
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kunjungan Klien & Audit Cabang Surabaya"
                  value={tripForm.title}
                  onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Negara Destinasi
                  </label>
                  <input
                    type="text"
                    placeholder="Surabaya, Jatim"
                    value={tripForm.destination}
                    onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Permohonan Uang Muka (Cash Advance)
                  </label>
                  <input
                    type="number"
                    placeholder="Rp"
                    value={tripForm.cashAdvanceAmount || ""}
                    onChange={(e) => setTripForm({ ...tripForm, cashAdvanceAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Berangkat
                  </label>
                  <input
                    type="date"
                    value={tripForm.startDate}
                    onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kembali
                  </label>
                  <input
                    type="date"
                    value={tripForm.endDate}
                    onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maksud & Tujuan Tugas
                </label>
                <textarea
                  rows={2}
                  value={tripForm.purpose}
                  onChange={(e) => setTripForm({ ...tripForm, purpose: e.target.value })}
                  placeholder="Deskripsi tugas perjalanan dinas..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
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

      {/* Settlement Claim Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Klaim Realisasi Biaya (Settlement)
              </h3>
              <button onClick={() => setShowSettlementModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSettlement} className="mt-4 space-y-4 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 text-xs">
                <div>Agenda: <strong>{showSettlementModal.title}</strong></div>
                <div>Uang Muka Diterima: <strong className="text-teal-600">Rp {Number(showSettlementModal.cashAdvanceAmount).toLocaleString("id-ID")}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Riil Pengeluaran (Berdasarkan Nota)
                </label>
                <input
                  type="number"
                  placeholder="Rp"
                  value={settlementForm.totalReceipts || ""}
                  onChange={(e) => setSettlementForm({ ...settlementForm, totalReceipts: Number(e.target.value) })}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
                />
              </div>

              {/* Difference Calculation Live Preview */}
              {settlementForm.totalReceipts > 0 && (
                <div className="rounded-xl border p-3 text-xs">
                  {settlementForm.totalReceipts >= showSettlementModal.cashAdvanceAmount ? (
                    <div className="text-emerald-700 dark:text-emerald-400">
                      <strong>Reimbursement Perusahaan ke Karyawan:</strong>
                      <br />
                      + Rp {(settlementForm.totalReceipts - showSettlementModal.cashAdvanceAmount).toLocaleString("id-ID")}
                    </div>
                  ) : (
                    <div className="text-amber-700 dark:text-amber-400">
                      <strong>Pengembalian Sisa Uang Muka ke Perusahaan:</strong>
                      <br />
                      - Rp {(showSettlementModal.cashAdvanceAmount - settlementForm.totalReceipts).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan rincian biaya (Tiket, Hotel, Taxi)
                </label>
                <textarea
                  rows={3}
                  value={settlementForm.notes}
                  onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                  placeholder="Rincian pengeluaran perjalanan..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettlementModal(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Kirim Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
