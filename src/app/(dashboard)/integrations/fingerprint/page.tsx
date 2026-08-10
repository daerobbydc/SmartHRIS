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
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  SectionHeader,
  StatCard,
  ModernButton,
  AnimatedBadge,
  Modal,
  LoadingSpinner,
} from "@/components/ui";

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
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
      const res = await fetch("/api/integrations/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const resText = data.results?.[0]?.message || "Simulasi scan berhasil diproses!";
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

  const bridgeCodeSnippet = `// SmartHRIS Local LAN Fingerprint Bridge Agent (Node.js)
const axios = require('axios');

const SMARTHRIS_WEBHOOK_URL = 'http://localhost:3000/api/integrations/fingerprint';
const DEVICE_CODE = 'FP-LOBI-01';

// Simulasi event listener dari mesin lokal (Port 4370 UDP/TCP)
function onFingerprintScan(employeePin, scanType = 'CHECK_IN') {
  console.log(\`[SCAN DETECTED] PIN: \${employeePin}\`);
  
  axios.post(SMARTHRIS_WEBHOOK_URL, {
    deviceCode: DEVICE_CODE,
    employeePin: employeePin,
    timestamp: new Date().toISOString(),
    scanType: scanType,
    verifyMode: 'FINGERPRINT'
  }).then(res => {
    console.log('✅ Synchronized to SmartHRIS Cloud:', res.data);
  }).catch(err => {
    console.error('❌ Sync failed:', err.message);
  });
}

// Menjalankan listener
console.log('⚡ SmartHRIS Bridge Agent active listening to LAN Fingerprint Device...');
`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-7 w-7 text-teal-300" />
            <h1 className="text-2xl font-bold tracking-tight">Integrasi Realtime Mesin Fingerprint</h1>
          </div>
          <p className="text-teal-100 text-sm">
            Koneksikan mesin sidik jari/wajah fisik Solution, ZKTeco, & Fingerspot secara instan via Push Webhook / ADMS API.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <button
            onClick={() => setShowBridgeModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition flex items-center gap-2"
          >
            <Code2 className="h-4 w-4" /> Kode Local Agent
          </button>
          <button
            onClick={() => setShowDeviceModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-teal-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Tambah Mesin
          </button>
        </div>
      </div>

      {/* Alert Message Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl flex items-center justify-between shadow-md",
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            )}
          >
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold underline ml-4 hover:opacity-75"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Connected Hardware Devices & Test Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Registered Devices & Webhook Simulator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Registered Hardware List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-teal-600" /> Perangkat Mesin Biometric Terhubung ({devices.length})
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
                  Klik &quot;Tambah Mesin&quot; untuk mendaftarkan mesin fingerprint Solution / ZKTeco kantor Anda.
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
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {device.deviceCode}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900">{device.name}</h3>
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
                      {device.ipAddress && <p>🌐 <strong>IP Address:</strong> {device.ipAddress}</p>}
                      <p className="text-[11px] text-gray-400">
                        ⏱ Last Sync: {device.lastSyncAt ? formatDate(device.lastSyncAt) : "Belum Pernah Sync"}
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
                <Send className="h-5 w-5 text-indigo-600" /> Simulator Transaksi Realtime Scan
              </h2>
              <p className="text-xs text-gray-500">Uji coba pengiriman payload webhook dari mesin fingerprint ke SmartHRIS</p>
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
                    <option value="FP-SIMULATOR-01">FP-SIMULATOR-01 (Simulasi Test)</option>
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
                    <option value="FINGERPRINT">FINGERPRINT (Sidik Jari)</option>
                    <option value="FACE">FACE RECOGNITION (Wajah)</option>
                    <option value="CARD">RFID CARD (Kartu)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {simulating ? "Mengirim Webhook..." : "Kirim Simulasi Scan Fingerprint"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column (1 Col): Webhook Endpoint Info & API Guide */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" /> Informasi Webhook Endpoint
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium block mb-1">URL Realtime Webhook Receiver:</span>
                <div className="p-2.5 bg-gray-900 text-teal-400 font-mono text-[11px] rounded-xl flex items-center justify-between border border-gray-800">
                  <span className="truncate">/api/integrations/fingerprint</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/integrations/fingerprint`);
                      setCopiedToken("url");
                      setTimeout(() => setCopiedToken(null), 2000);
                    }}
                    className="text-gray-400 hover:text-white ml-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {copiedToken === "url" && <span className="text-[10px] text-emerald-600 font-bold">✓ URL tersalin!</span>}
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Metode HTTP:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  POST (JSON / ADMS cdata)
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-amber-600" /> Pengaturan Mesin Solution / ZKTeco:
                </p>
                <p className="text-[11px]">
                  Aktifkan fitur <strong>ADMS / Cloud Web Server</strong> pada menu network mesin fingerprint, lalu isi Web Domain dengan URL SmartHRIS di atas.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Realtime Incoming Biometric Scan Log Stream */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" /> Feed Log Scan Biometric Realtime
            </h2>
            <p className="text-xs text-gray-500">Log perekaman transaksi masuk dari seluruh mesin fingerprint terhubung</p>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Refresh Log Stream"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Belum ada data scan biometric diterima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Waktu Scan</th>
                  <th className="py-3 px-4">Perangkat Mesin</th>
                  <th className="py-3 px-4">PIN / NIK</th>
                  <th className="py-3 px-4">Match Karyawan SmartHRIS</th>
                  <th className="py-3 px-4">Mode Scan</th>
                  <th className="py-3 px-4">Status Integrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-teal-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {log.device ? `${log.device.name} (${log.device.deviceCode})` : log.deviceId}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {log.employeePin}
                    </td>
                    <td className="py-3 px-4">
                      {log.employee ? (
                        <div>
                          <p className="font-bold text-gray-900">
                            {log.employee.firstName} {log.employee.lastName}
                          </p>
                          <p className="text-[10px] text-gray-400">{log.employee.department}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                          ⚠️ Tidak Ditemukan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-[10px]">
                        {log.verifyMode} ({log.scanType})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.isProcessed ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-semibold text-[10px]">
                          ✓ Tersimpan ke Absensi
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-[10px]">
                          Pending
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

      {/* Modal Tambah Perangkat Fingerprint */}
      {showDeviceModal && (
        <Modal
          isOpen={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          title="Daftarkan Mesin Fingerprint Baru"
        >
          <form onSubmit={handleCreateDevice} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Kode Perangkat (SN / Code) *</label>
              <input
                type="text"
                required
                value={newDevice.deviceCode}
                onChange={(e) => setNewDevice({ ...newDevice, deviceCode: e.target.value })}
                placeholder="Contoh: FP-HQ-01 ATAU SN MESIN (Misal: FP98237)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Mesin Fingerprint *</label>
              <input
                type="text"
                required
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="Contoh: Mesin Solution X100-C Lobi Utama"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Lokasi Pemasangan</label>
              <input
                type="text"
                value={newDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                placeholder="Kantor Pusat Gedung A Lt. 1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">IP Address Mesin (Opsional jika LAN)</label>
              <input
                type="text"
                value={newDevice.ipAddress}
                onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                placeholder="192.168.1.201"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeviceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
              >
                Simpan Pendaftaran Perangkat
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Code Local Agent Bridge */}
      {showBridgeModal && (
        <Modal
          isOpen={showBridgeModal}
          onClose={() => setShowBridgeModal(false)}
          title="Script Local LAN Bridge Agent (Node.js)"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Gunakan kode Node.js ini pada komputer/server lokal kantor yang terhubung ke IP Mesin Fingerprint via LAN (Port 4370 UDP/TCP) untuk meneruskan data scan ke SmartHRIS.
            </p>

            <div className="relative">
              <pre className="p-4 bg-gray-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80">
                {bridgeCodeSnippet}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bridgeCodeSnippet);
                  alert("Kode Bridge Agent tersalin!");
                }}
                className="absolute top-3 right-3 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg backdrop-blur-md flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" /> Salin Kode
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowBridgeModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
