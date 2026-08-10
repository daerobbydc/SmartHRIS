"use client";

import { useState } from "react";
import {
  MessageSquare,
  Send,
  Bell,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  PhoneCall,
  Terminal,
  UserCheck,
} from "lucide-react";

interface DispatchLog {
  id: string;
  phone: string;
  type: string;
  message: string;
  timestamp: string;
  status: "SENT" | "PENDING" | "FAILED";
}

export default function WhatsAppConsolePage() {
  const [phone, setPhone] = useState("081234567890");
  const [actionType, setActionType] = useState<"APPROVAL_ALERT" | "ATTENDANCE_REMINDER" | "PAYSLIP_LINK">("APPROVAL_ALERT");
  const [managerName, setManagerName] = useState("Budi Santoso");
  const [employeeName, setEmployeeName] = useState("Ahmad Fauzi");
  const [requestType, setRequestType] = useState<"Cuti" | "Lembur" | "Tukar Shift">("Cuti");
  const [details, setDetails] = useState("Pengajuan Cuti Tahunan 3 Hari (12-14 Ags 2026)");
  const [reminderType, setReminderType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");

  const [loading, setLoading] = useState(false);
  const [lastDispatchedMessage, setLastDispatchedMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<DispatchLog[]>([
    {
      id: "WA-101",
      phone: "6281234567890",
      type: "APPROVAL_ALERT",
      message: "🔔 Notification sent to Manager Budi Santoso for Leave Approval",
      timestamp: new Date().toLocaleTimeString("id-ID"),
      status: "SENT",
    },
  ]);

  const handleSendWA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          actionType,
          managerName,
          employeeName,
          requestType,
          details,
          reminderType,
          scheduleTime: "08:00",
          periodMonth: "Agustus 2026",
          encryptedLink: "https://smarthris.com/payroll/download/encrypted-token-88219",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastDispatchedMessage(data.dispatchedMessage);

        const newLog: DispatchLog = {
          id: data.logId || `WA-${Date.now()}`,
          phone,
          type: actionType,
          message: data.dispatchedMessage,
          timestamp: new Date().toLocaleTimeString("id-ID"),
          status: "SENT",
        };

        setLogs((prev) => [newLog, ...prev]);
      }
    } catch (err) {
      console.error("WA dispatch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              WhatsApp & Notification Bot Console
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <MessageSquare className="h-3.5 w-3.5" /> WA Gateway
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pengiriman pesan terstruktur langsung ke WhatsApp Manager & Karyawan (Approval Alert, Reminders, Slip Gaji).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Test Console Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Send className="h-4 w-4 text-teal-600" /> Tes Pengiriman WhatsApp
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Simulasi dan pengujian format template WhatsApp bot terotomatisasi.
          </p>

          <form onSubmit={handleSendWA} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Template WhatsApp
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="APPROVAL_ALERT">🔔 Approval Alert (Cuti / Lembur / Shift Swap)</option>
                <option value="ATTENDANCE_REMINDER">⏰ Attendance Reminder (Masuk / Keluar)</option>
                <option value="PAYSLIP_LINK">💵 Encrypted Digital Payslip Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp Tujuan
              </label>
              <input
                type="text"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            {actionType === "APPROVAL_ALERT" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Manager</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Karyawan</label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Pengajuan</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Cuti">Cuti Tahunan</option>
                    <option value="Lembur">Kerja Lembur</option>
                    <option value="Tukar Shift">Tukar Shift Roster</option>
                  </select>
                </div>
              </>
            )}

            {actionType === "ATTENDANCE_REMINDER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Pengingat Presensi</label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="CHECK_IN">Check-In Presensi Masuk (08:00)</option>
                  <option value="CHECK_OUT">Check-Out Presensi Keluar (17:00)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? "Mengirim Pesan WA..." : "Kirim Pesan WhatsApp"}
            </button>
          </form>
        </div>

        {/* Live Payload Preview & Logs */}
        <div className="space-y-6">
          {/* Preview Panel */}
          {lastDispatchedMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Pesan Terkirim Berhasil:
              </h3>
              <pre className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900 font-sans">
                {lastDispatchedMessage}
              </pre>
            </div>
          )}

          {/* Logs History */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-teal-600" /> Log Riwayat WhatsApp Gateway
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                    <span>{log.phone}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 line-clamp-2">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
