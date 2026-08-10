"use client";

import { useEffect, useState } from "react";
import {
  Plug,
  Building2,
  CreditCard,
  FileText,
  Bell,
  Calendar,
  MessageSquare,
  ExternalLink,
  Download,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";

interface IntegrationStatus {
  bpjs: boolean;
  bank: boolean;
  espt: boolean;
  slack: boolean;
  teams: boolean;
}

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
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Check integration status from environment
    setStatus({
      bpjs: !!process.env.NEXT_PUBLIC_BPJS_API_URL,
      bank: true,
      espt: true,
      slack: !!process.env.NEXT_PUBLIC_SLACK_WEBHOOK,
      teams: !!process.env.NEXT_PUBLIC_TEAMS_WEBHOOK,
    });
  }, []);

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

  const handleBankDownload = async (bank: string) => {
    setLoading(`bank-${bank}`);
    try {
      const res = await fetch(`/api/integrations/bank?month=${month}&year=${year}&bank=${bank}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transfer-${bank.toLowerCase()}-${month}-${year}.csv`;
        a.click();
      }
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
        <a href="/integrations/fingerprint" className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition">
          <ExternalLink className="h-3.5 w-3.5" /> Buka Pengelola Mesin Fingerprint
        </a>
      ),
    },
    {
      id: "bpjs",
      name: "BPJS Ketenagakerjaan",
      description: "Submit data BPJS secara online",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      status: status.bpjs,
      actions: (
        <div className="flex gap-2">
          <button onClick={handleBPJSDownload} disabled={loading === "bpjs"} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium">
            <Download className="h-3.5 w-3.5 inline mr-1" /> Download CSV
          </button>
          <button onClick={handleBPJSSubmit} disabled={loading === "bpjs-submit"} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium">
            <ExternalLink className="h-3.5 w-3.5 inline mr-1" /> Submit Online
          </button>
        </div>
      ),
    },
    {
      id: "bank",
      name: "Bank Auto-Upload",
      description: "Generate file transfer gaji",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
      status: status.bank,
      actions: (
        <div className="flex gap-2 flex-wrap">
          {["BCA", "MANDIRI", "BNI", "BRI"].map((bank) => (
            <button key={bank} onClick={() => handleBankDownload(bank)} disabled={loading === `bank-${bank}`} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium">
              {bank}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "espt",
      name: "E-SPT PPh 21",
      description: "Generate format E-SPT untuk DJP Online",
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
      status: status.espt,
      actions: (
        <div className="flex gap-2">
          <button onClick={() => handleESPTDownload("csv")} disabled={loading === "espt-csv"} className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-medium">
            <Download className="h-3.5 w-3.5 inline mr-1" /> CSV
          </button>
          <button onClick={() => handleESPTDownload("json")} disabled={loading === "espt-json"} className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-medium">
            <Download className="h-3.5 w-3.5 inline mr-1" /> JSON
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
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleDateString("id-ID", { month: "long" })}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2">
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
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
            <div className="mt-4 pt-4 border-t border-gray-100">
              {integration.actions}
            </div>
          </div>
        ))}
      </div>

      {/* Environment Variables Help */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">Environment Variables</h3>
        <p className="text-xs text-gray-600 mb-3">Tambahkan variabel berikut di file <code className="bg-gray-200 px-1 rounded">.env</code>:</p>
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
