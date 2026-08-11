"use client";

import { useEffect, useState } from "react";
import {
  Fingerprint,
  Cpu,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Code2,
  Copy,
  Info,
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  Globe,
  Radio,
  Server,
  Terminal,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Device {
  id: string;
  deviceCode: string;
  name: string;
  ipAddress: string | null;
  location: string | null;
  secretToken: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  _count?: { logs: number };
}

interface BiometricLog {
  id: string;
  deviceId: string;
  employeePin: string;
  timestamp: string;
  scanType: string;
  verifyMode: string;
  isProcessed: boolean;
  rawPayload: string | null;
  device: Device;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  } | null;
}

export default function FingerprintIntegrationPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const [baseUrl, setBaseUrl] = useState<string>("");

  // New Device Form
  const [newDevice, setNewDevice] = useState({
    deviceCode: "",
    name: "",
    ipAddress: "",
    location: "Kantor Pusat Lobi",
  });

  // Simulator Form
  const [simForm, setSimForm] = useState({
    deviceCode: "",
    employeePin: "",
    scanType: "CHECK_IN",
    verifyMode: "FINGERPRINT",
  });
  const [simulating, setSimulating] = useState<boolean>(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.origin}/api/biometric/push`);
    }
    fetchDevices();
    fetchLogs();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/integrations/fingerprint/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
        if (data.length > 0 && !simForm.deviceCode) {
          setSimForm((prev) => ({ ...prev, deviceCode: data[0].deviceCode }));
        }
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/fingerprint");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching biometric logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/integrations/fingerprint/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      });

      if (res.ok) {
        setShowDeviceModal(false);
        setNewDevice({ deviceCode: "", name: "", ipAddress: "", location: "Kantor Pusat Lobi" });
        setMessage({ text: "Mesin fingerprint berhasil didaftarkan!", type: "success" });
        fetchDevices();
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Gagal mendaftarkan mesin", type: "error" });
      }
    } catch (err) {
      console.error("Error creating device:", err);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Hapus pendaftaran mesin "${name}"?`)) return;
    try {
      const res = await fetch(`/api/integrations/fingerprint/devices?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchDevices();
        setMessage({ text: "Mesin berhasil dihapus", type: "success" });
      }
    } catch (err) {
      console.error("Error deleting device:", err);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simForm.employeePin) {
      alert("PIN / NIK Karyawan wajib diisi");
      return;
    }

    setSimulating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/biometric/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-code": simForm.deviceCode || "FP-SIMULATOR-01",
        },
        body: JSON.stringify({
          deviceCode: simForm.deviceCode || "FP-SIMULATOR-01",
          employeePin: simForm.employeePin,
          timestamp: new Date().toISOString(),
          scanType: simForm.scanType,
          verifyMode: simForm.verifyMode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const resText = data.results?.[0]?.message || "Log push biometric berhasil diproses!";
        setMessage({ text: resText, type: "success" });
        fetchLogs();
        fetchDevices();
      } else {
        setMessage({ text: data.error || "Gagal mensimulasikan scan", type: "error" });
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  const copyPushUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-7 w-7 text-teal-300" />
            <h1 className="text-2xl font-bold tracking-tight">Integrasi Realtime Mesin Fingerprint (ADMS Push)</h1>
          </div>
          <p className="text-teal-100 text-sm">
            Terima log presensi dari mesin Solution, ZKTeco, & Hikvision secara otomatis via Push Webhook tanpa polling manual.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <button
            onClick={() => setShowGuideModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition flex items-center gap-2"
          >
            <Info className="h-4 w-4" /> Panduan Konfigurasi Mesin
          </button>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-teal-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Tambah Mesin
          </button>
        </div>
      </div>

      {/* Push Webhook Server URL Info Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" /> Webhook Push Server URL Realtime
            </span>
            <h2 className="text-sm font-bold text-slate-200">
              Masukkan URL ini pada menu Cloud Server / ADMS / HTTP Listening di Mesin Fisik
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 select-all overflow-x-auto">
              <span>{baseUrl || "/api/biometric/push"}</span>
            </div>
          </div>
          <button
            onClick={copyPushUrl}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-md"
          >
            {copiedUrl ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            {copiedUrl ? "URL Tersalin!" : "Salin Push URL"}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border transition",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Columns: Registered Hardware & Simulator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registered Hardware List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-teal-600" /> Mesin Biometric Terhubung ({devices.length})
              </h2>
              <button
                onClick={fetchDevices}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Refresh Perangkat"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="py-8 text-center space-y-2 border-2 border-dashed border-gray-200 rounded-xl">
                <Fingerprint className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">Belum Ada Mesin Terdaftar</p>
                <p className="text-xs text-gray-400">
                  Mesin fisik Solution / ZKTeco / Hikvision akan otomatis terdaftar saat pertama kali mengirim Push Log.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {device.deviceCode}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-green-50 text-green-700 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> ONLINE
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">{device.name}</h3>
                      </div>
                      <button
                        onClick={() => handleDeleteDevice(device.id, device.name)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Hapus Perangkat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs space-y-1 text-gray-600">
                      <p>📍 <strong>Lokasi:</strong> {device.location || "-"}</p>
                      <p className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                        <strong>IP Address:</strong> {device.ipAddress || "Auto-detected"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        ⏱ Terakhir Sync: {device.lastSyncAt ? formatDate(device.lastSyncAt) : "Belum Ada"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Total Scan Log:</span>
                      <span className="font-bold text-teal-700">{device._count?.logs || 0} scan</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Webhook Simulator */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" /> Simulator Realtime Push Webhook
              </h2>
              <p className="text-xs text-gray-500">
                Uji coba pengiriman payload scan dari mesin fingerprint ke endpoint SmartHRIS (`/api/biometric/push`)
              </p>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Perangkat Mesin *</label>
                  <select
                    value={simForm.deviceCode}
                    onChange={(e) => setSimForm({ ...simForm, deviceCode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="FP-SOLUTION-01">FP-SOLUTION-01 (Solution ADMS)</option>
                    <option value="FP-ZKTECO-01">FP-ZKTECO-01 (ZKTeco ADMS)</option>
                    <option value="FP-HIKVISION-01">FP-HIKVISION-01 (Hikvision ISAPI)</option>
                    {devices.map((dev) => (
                      <option key={dev.id} value={dev.deviceCode}>
                        {dev.name} ({dev.deviceCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">PIN / NIK / ID Karyawan *</label>
                  <input
                    type="text"
                    required
                    value={simForm.employeePin}
                    onChange={(e) => setSimForm({ ...simForm, employeePin: e.target.value })}
                    placeholder="Contoh: EMP001 / NIK Karyawan"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Tipe Presensi (Scan Action)</label>
                  <select
                    value={simForm.scanType}
                    onChange={(e) => setSimForm({ ...simForm, scanType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium"
                  >
                    <option value="CHECK_IN">ABSEN MASUK (CLOCK IN)</option>
                    <option value="CHECK_OUT">ABSEN KELUAR (CLOCK OUT)</option>
                    <option value="AUTOMATIC">OTOMATIS (SISTEM DETEKSI Jam)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Mode Verifikasi Biometric</label>
                  <select
                    value={simForm.verifyMode}
                    onChange={(e) => setSimForm({ ...simForm, verifyMode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium"
                  >
                    <option value="FINGERPRINT">Sidik Jari (Fingerprint)</option>
                    <option value="FACE">Wajah (Facial Recognition)</option>
                    <option value="CARD">Kartu RFID / E-KTP</option>
                    <option value="PASSWORD">PIN / Password</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {simulating ? "Kirimkan Test Push Webhook..." : "Jalankan Simulasi Realtime Push Webhook"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Protocols Supported & Statistics */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-teal-600" /> Protokol Mesin yang Didukung
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-teal-50 text-teal-900 rounded-xl border border-teal-100">
                <span className="font-bold block">1. Solution / ZKTeco ADMS</span>
                Protokol HTTP Push `iclock/cdata`. Mengirim data instan saat jari ditempelkan.
              </div>
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-100">
                <span className="font-bold block">2. Hikvision ISAPI Event Push</span>
                Protokol HTTP Listener JSON/XML dari terminal Hikvision Facial/Card Reader.
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-100">
                <span className="font-bold block">3. REST API Webhook</span>
                Format JSON standar `POST /api/biometric/push` untuk integrasi custom app/bridge.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Realtime Incoming Biometric Scan Log Stream */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" /> Feed Log Scan Biometric Realtime
            </h2>
            <p className="text-xs text-gray-500">Log kehadiran langsung dari mesin sidik jari/wajah fisik</p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Feed
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Belum ada data scan biometric diterima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Waktu Scan</th>
                  <th className="px-4 py-3">Mesin / Device</th>
                  <th className="px-4 py-3">PIN / NIK</th>
                  <th className="px-4 py-3">Karyawan SmartHRIS</th>
                  <th className="px-4 py-3">Tipe Presensi</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3 text-right">Status Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800">{log.device?.name || log.deviceId}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        IP: {log.device?.ipAddress || "Local LAN"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">{log.employeePin}</td>
                    <td className="px-4 py-3 font-semibold">
                      {log.employee ? (
                        <div>
                          <span className="text-gray-900 font-bold">
                            {log.employee.firstName} {log.employee.lastName}
                          </span>
                          <span className="text-[10px] text-gray-400 block">{log.employee.department}</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> NIK Belum Terdaftar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          log.scanType === "CHECK_IN"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.scanType === "CHECK_OUT"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        )}
                      >
                        {log.scanType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.verifyMode}</td>
                    <td className="px-4 py-3 text-right">
                      {log.employee ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> MATCHED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">
                          UNMATCHED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-teal-600" /> Panduan Pengesetan Mesin Fisik
            </h2>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="font-bold text-gray-800">1. Solution / ZKTeco (Menu Mesin ADMS):</p>
                <ol className="list-disc pl-4 space-y-0.5">
                  <li>Masuk ke Menu Mesin -&gt; Komunikasi -&gt; ADMS / Cloud Server.</li>
                  <li>Isi Server Domain / IP: {baseUrl ? new URL(baseUrl).hostname : "domain.com"}</li>
                  <li>Isi Web Push / Path URL: <code>/api/biometric/push</code></li>
                  <li>Simpan & Restart mesin.</li>
                </ol>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="font-bold text-gray-800">2. Hikvision (Web Admin ISAPI):</p>
                <ol className="list-disc pl-4 space-y-0.5">
                  <li>Login Web Admin Mesin -&gt; Network -&gt; Advanced -&gt; HTTP Listening / Event Push.</li>
                  <li>Isi Destination IP / Domain: {baseUrl ? new URL(baseUrl).hostname : "domain.com"}</li>
                  <li>Isi Destination URL: <code>/api/biometric/push</code></li>
                  <li>Pilih Payload Format: JSON.</li>
                </ol>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-teal-600" /> Pendaftaran Mesin Baru
            </h2>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Kode Mesin / Serial Number (SN) *</label>
                <input
                  type="text"
                  required
                  value={newDevice.deviceCode}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceCode: e.target.value })}
                  placeholder="Contoh: FP-LOBI-01 atau SN Mesin"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Perangkat *</label>
                <input
                  type="text"
                  required
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="Contoh: Mesin Solution Lobi Utama"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Lokasi Pemasangan</label>
                <input
                  type="text"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  placeholder="Contoh: Gedung A Lt 1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Simpan Mesin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
