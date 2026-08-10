"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  DollarSign,
  Lock,
  ShieldCheck,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBadge, Modal, LoadingSpinner } from "@/components/ui";
import { AutocompleteSelect } from "@/components/ui/autocomplete-select";

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Modal Detail
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter, userFilter, dateFrom, dateTo, page]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/employees?limit=100");
      if (res.ok) {
        const data = await res.json();
        const userOpts = (data.employees || []).map((e: { id: string; firstName: string; lastName: string; user?: { role: string } }) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          role: e.user?.role || "EMPLOYEE",
        }));
        setUsers(userOpts);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (userFilter) params.set("userId", userFilter);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    const headers = ["Waktu", "Pengguna", "Role", "Aktivitas", "Modul", "Detail", "IP Address"];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("id-ID"),
      log.userName || "System",
      log.userRole || "-",
      log.action,
      log.entity,
      log.details || "-",
      log.ipAddress || "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleResetFilters = () => {
    setSearch("");
    setEntityFilter("");
    setActionFilter("");
    setUserFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const parseJson = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "danger";
      case "APPROVE":
        return "success";
      case "REJECT":
        return "danger";
      case "VIEW_PAYROLL":
        return "warning";
      case "LOGIN":
        return "info";
      case "LOGOUT":
        return "default";
      default:
        return "default";
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Trail & Security Logs</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pencatatan seluruh aktivitas perubahan data sensitif, persetujuan, payroll, dan akses sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Log</p>
            <p className="text-xl font-extrabold text-gray-900">{total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Payroll</p>
            <p className="text-xl font-extrabold text-gray-900">
              {logs.filter((l) => l.entity === "Payroll").length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Karyawan</p>
            <p className="text-xl font-extrabold text-gray-900">
              {logs.filter((l) => l.entity === "Employee").length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Akses Sistem</p>
            <p className="text-xl font-extrabold text-gray-900">
              {logs.filter((l) => ["LOGIN", "LOGOUT", "VIEW_PAYROLL"].includes(l.action)).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, detail, atau ID..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <AutocompleteSelect
            options={[
              { value: "", label: "Semua Modul System" },
              { value: "Employee", label: "Personalia Karyawan" },
              { value: "Payroll", label: "Penggajian & THR" },
              { value: "Leave", label: "Izin & Cuti" },
              { value: "Attendance", label: "Presensi & Lembur" },
              { value: "OfficeLocation", label: "Kantor Cabang" },
              { value: "System", label: "Sistem & Keamanan" },
            ]}
            value={entityFilter}
            onChange={(val) => { setEntityFilter(val); setPage(1); }}
            placeholder="Filter Modul..."
            className="w-48"
          />

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">Semua Aktivitas</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="LOGIN">LOGIN</option>
            <option value="VIEW_PAYROLL">VIEW PAYROLL</option>
          </select>

          <select
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="">Semua Pengguna</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Date Range & Reset */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Periode:</span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <span className="text-gray-400 text-xs">s/d</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 font-medium underline"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 space-y-2">
            <ShieldCheck className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">Tidak ada log ditemukan</p>
            <p>Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Pengguna</th>
                    <th className="py-3.5 px-4">Aktivitas</th>
                    <th className="py-3.5 px-4">Modul</th>
                    <th className="py-3.5 px-4">Detail</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-600">
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-gray-900">{log.userName || "System"}</p>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {log.userRole || "EMPLOYEE"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <AnimatedBadge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </AnimatedBadge>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-gray-700">
                        {log.entity}
                      </td>

                      <td className="py-3.5 px-4 max-w-[280px] truncate text-gray-600" title={log.details || ""}>
                        {log.details || "-"}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {log.ipAddress || "127.0.0.1"}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {(log.oldData || log.newData) ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detail
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} dari {total} log
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-700">
                  Halaman {page} dari {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Detail */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detail Perubahan Data (Diff)"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium">Pengguna:</span>
                <p className="font-bold text-gray-900">{selectedLog.userName} ({selectedLog.userRole})</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Aktivitas:</span>
                <p className="font-bold text-teal-700">{selectedLog.action} pada {selectedLog.entity}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Waktu:</span>
                <p className="text-gray-800">{new Date(selectedLog.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">IP Address:</span>
                <p className="text-gray-800">{selectedLog.ipAddress || "-"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 font-medium">Detail:</span>
                <p className="text-gray-800">{selectedLog.details || "-"}</p>
              </div>
            </div>

            {/* Diff Viewer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block text-center">
                  SEBELUM PERUBAHAN
                </span>
                <div className="bg-gray-900 text-rose-300 p-3 rounded-xl overflow-x-auto max-h-60 text-[11px]">
                  <pre>{JSON.stringify(parseJson(selectedLog.oldData), null, 2) || "N/A"}</pre>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block text-center">
                  SETELAH PERUBAHAN
                </span>
                <div className="bg-gray-900 text-emerald-300 p-3 rounded-xl overflow-x-auto max-h-60 text-[11px]">
                  <pre>{JSON.stringify(parseJson(selectedLog.newData), null, 2) || "N/A"}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
