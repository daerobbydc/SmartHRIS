"use client";

import { useEffect, useState } from "react";
import {
  Plug,
  Building2,
  CreditCard,
  FileText,
  Calendar,
  MessageSquare,
  ExternalLink,
  Download,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface IntegrationStatus {
  bpjs: boolean;
  bank: boolean;
  espt: boolean;
  slack: boolean;
  teams: boolean;
}

interface BankSummary {
  totalTransfers: number;
  validCount: number;
  missingCount: number;
  totalAmount: number;
  validAmount: number;
  missingEmployees: { employeeId: string; employeeName: string }[];
  byBank: Record<string, { count: number; amount: number; validCount: number }>;
}

const SUPPORTED_BANKS = [
  { code: "ALL", name: "Semua Bank (Standard Multi-Bank)" },
  { code: "BCA", name: "BCA (KlikBCA Bisnis)" },
  { code: "MANDIRI", name: "Bank Mandiri (MCM 2.0)" },
  { code: "BNI", name: "BNI (BNI Direct)" },
  { code: "BRI", name: "BRI (BRIVA / CMS)" },
  { code: "BSI", name: "BSI (Bank Syariah Indonesia)" },
  { code: "CIMB", name: "Bank CIMB Niaga (BizChannel)" },
  { code: "PERMATA", name: "Bank Permata (e-Business)" },
  { code: "BTN", name: "Bank Tabungan Negara (BTN CMS)" },
  { code: "DANAMON", name: "Bank Danamon" },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus>({
    bpjs: false,
    bank: false,
    espt: false,
    slack: false,
    teams: false,
  });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedBank, setSelectedBank] = useState("ALL");
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "txt">("csv");
  const [loading, setLoading] = useState<string | null>(null);
  const [bankSummary, setBankSummary] = useState<BankSummary | null>(null);
  const [fetchingSummary, setFetchingSummary] = useState(false);

  useEffect(() => {
    setStatus({
      bpjs: !!process.env.NEXT_PUBLIC_BPJS_API_URL,
      bank: true,
      espt: true,
      slack: !!process.env.NEXT_PUBLIC_SLACK_WEBHOOK,
      teams: !!process.env.NEXT_PUBLIC_TEAMS_WEBHOOK,
    });
  }, []);

  useEffect(() => {
    fetchBankSummary();
  }, [month, year, selectedBank]);

  const fetchBankSummary = async () => {
    setFetchingSummary(true);
    try {
      const res = await fetch(
        `/api/integrations/bank?month=${month}&year=${year}&bank=${selectedBank}&action=summary`
      );
      if (res.ok) {
        const data = await res.json();
        setBankSummary(data.summary || null);
      } else {
        setBankSummary(null);
      }
    } catch (error) {
      console.error("Error fetching bank summary:", error);
      setBankSummary(null);
    } finally {
      setFetchingSummary(false);
    }
  };

  const handleBPJSDownload = async () => {
    setLoading("bpjs");
    try {
      const res = await fetch(`/api/integrations/bpjs?month=${month}&year=${year}&format=csv`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bpjs-${month}-${year}.csv`;
        a.click();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleBPJSSubmit = async () => {
    setLoading("bpjs-submit");
    try {
      const res = await fetch("/api/integrations/bpjs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      if (res.ok) {
        alert("BPJS submission berhasil!");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleBankDownload = async (bankCode?: string, formatOverride?: "csv" | "txt") => {
    const bankToUse = bankCode || selectedBank;
    const formatToUse = formatOverride || selectedFormat;
    setLoading(`bank-${bankToUse}-${formatToUse}`);
    try {
      const res = await fetch(
        `/api/integrations/bank?month=${month}&year=${year}&bank=${bankToUse}&format=${formatToUse}`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transfer-${bankToUse.toLowerCase()}-${month}-${year}.${formatToUse}`;
        a.click();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Gagal mengunduh file transfer bank.");
      }
    } catch (err) {
      console.error("Download bank file error:", err);
      alert("Terjadi kesalahan saat mengunduh file.");
    } finally {
      setLoading(null);
    }
  };

  const handleESPTDownload = async (format: string) => {
    setLoading(`espt-${format}`);
    try {
      const res = await fetch(`/api/integrations/espt?month=${month}&year=${year}&format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `espt-21-${month}-${year}.${format}`;
        a.click();
      }
    } finally {
      setLoading(null);
    }
  };

  const integrations = [
    {
      id: "fingerprint",
      name: "Mesin Fingerprint Realtime",
      description: "Integrasi realtime Push Webhook / ADMS mesin Solution & ZKTeco",
      icon: Fingerprint,
      color: "bg-teal-50 text-teal-600",
      status: true,
      actions: (
        <a
          href="/integrations/fingerprint"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Buka Pengelola Mesin Fingerprint
        </a>
      ),
    },
    {
      id: "bpjs",
      name: "BPJS Ketenagakerjaan",
      description: "Submit data BPJS secara online & ekspor format CSV",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      status: status.bpjs,
      actions: (
        <div className="flex gap-2">
          <button
            onClick={handleBPJSDownload}
            disabled={loading === "bpjs"}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 inline mr-1" /> Download CSV
          </button>
          <button
            onClick={handleBPJSSubmit}
            disabled={loading === "bpjs-submit"}
            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5 inline mr-1" /> Submit Online
          </button>
        </div>
      ),
    },
    {
      id: "bank",
      name: "Bank Auto-Upload (Payroll Transfer)",
      description: "Generate file transfer gaji otomatis untuk BCA, Mandiri, BNI, BRI, BSI, CIMB, Permata, BTN, Danamon",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
      status: status.bank,
      customContent: (
        <div className="space-y-4 mt-2">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Bank Tujuan
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-3 py-2 text-slate-800 dark:text-white"
              >
                {SUPPORTED_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Format File
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as "csv" | "txt")}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg px-3 py-2 text-slate-800 dark:text-white"
              >
                <option value="csv">CSV (Excel / Delimited)</option>
                {selectedBank === "BCA" && <option value="txt">TXT (BCA KlikBCA Fixed Width)</option>}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => handleBankDownload()}
                disabled={loading?.startsWith("bank-")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {loading?.startsWith("bank-") ? "Mengunduh..." : "Download File Auto-Upload"}
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for Top Banks */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Unduh Cepat:</span>
            {["BCA", "MANDIRI", "BNI", "BRI", "BSI", "ALL"].map((code) => (
              <button
                key={code}
                onClick={() => handleBankDownload(code)}
                disabled={loading === `bank-${code}-${selectedFormat}`}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition border ${
                  selectedBank === code
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Transfer Summary Preview */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Ringkasan Data Transfer Periode {month}/{year}
              </span>
              <button
                onClick={fetchBankSummary}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${fetchingSummary ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {fetchingSummary ? (
              <div className="py-4 text-center text-xs text-slate-400">Memuat ringkasan transfer...</div>
            ) : bankSummary ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</span>
                    <div className="text-sm font-black text-slate-800 dark:text-white">{bankSummary.totalTransfers} Orang</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rekening Valid</span>
                    <div className="text-sm font-black text-emerald-600">{bankSummary.validCount} Karyawan</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Transfer</span>
                    <div className="text-sm font-black text-emerald-600">{formatCurrency(bankSummary.validAmount)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tanpa Rekening</span>
                    <div className={`text-sm font-black ${bankSummary.missingCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {bankSummary.missingCount} Karyawan
                    </div>
                  </div>
                </div>

                {bankSummary.missingCount > 0 && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Peringatan Rekening Kosong:</span> Karyawan berikut belum memiliki nomor rekening valid:{" "}
                      <span className="font-semibold">{bankSummary.missingEmployees.map((e) => e.employeeName).join(", ")}</span>.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Belum ada data gaji yang siap ditransfer untuk periode {month}/{year}.
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "espt",
      name: "E-SPT PPh 21",
      description: "Generate format E-SPT untuk DJP Online (CSV Masa 21-1 & JSON e-Filing)",
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
      status: status.espt,
      actions: (
        <div className="flex gap-2">
          <button
            onClick={() => handleESPTDownload("csv")}
            disabled={loading === "espt-csv"}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 inline mr-1" /> CSV (e-SPT 21-1)
          </button>
          <button
            onClick={() => handleESPTDownload("json")}
            disabled={loading === "espt-json"}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 inline mr-1" /> JSON (e-Filing DJP)
          </button>
        </div>
      ),
    },
    {
      id: "slack",
      name: "Slack Integration",
      description: "Notifikasi ke Slack workspace",
      icon: MessageSquare,
      color: "bg-amber-50 text-amber-600",
      status: status.slack,
      actions: (
        <button className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium">
          <ExternalLink className="h-3.5 w-3.5 inline mr-1" /> Configure
        </button>
      ),
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Notifikasi ke Teams channel",
      icon: MessageSquare,
      color: "bg-indigo-50 text-indigo-600",
      status: status.teams,
      actions: (
        <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium">
          <ExternalLink className="h-3.5 w-3.5 inline mr-1" /> Configure
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Plug className="h-6 w-6 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Integrations</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Kelola integrasi dengan sistem eksternal.</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Periode Transfer:</span>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleDateString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${integration.color}`}>
                  <integration.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{integration.name}</h3>
                  <p className="text-xs text-gray-500">{integration.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.status ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Not Configured
                  </span>
                )}
              </div>
            </div>

            {integration.customContent ? (
              <div className="mt-4 pt-4 border-t border-gray-100">{integration.customContent}</div>
            ) : (
              integration.actions && (
                <div className="mt-4 pt-4 border-t border-gray-100">{integration.actions}</div>
              )
            )}
          </div>
        ))}
      </div>

      {/* Environment Variables Help */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">Environment Variables</h3>
        <p className="text-xs text-gray-600 mb-3">
          Tambahkan variabel berikut di file <code className="bg-gray-200 px-1 rounded">.env</code>:
        </p>
        <div className="space-y-2 text-xs font-mono bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto">
          <div># BPJS Integration</div>
          <div>NEXT_PUBLIC_BPJS_API_URL=https://api.bpjsketenagakerjaan.go.id</div>
          <div>BPJS_USERNAME=your_username</div>
          <div>BPJS_PASSWORD=your_password</div>
          <div>BPJS_COMPANY_CODE=your_company_code</div>
          <div className="mt-2"># Company Info</div>
          <div>COMPANY_NPWP=12.345.678.9-012.000</div>
          <div>COMPANY_NAME=PT SmartHRIS Indonesia</div>
          <div className="mt-2"># Webhooks</div>
          <div>NEXT_PUBLIC_SLACK_WEBHOOK=https://hooks.slack.com/...</div>
          <div>NEXT_PUBLIC_TEAMS_WEBHOOK=https://outlook.office.com/webhook/...</div>
        </div>
      </div>
    </div>
  );
}
