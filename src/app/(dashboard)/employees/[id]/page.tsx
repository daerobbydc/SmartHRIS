"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, Briefcase, Mail, Phone, Calendar, DollarSign, ShieldCheck, Clock, Award } from "lucide-react";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import { AnimatedBadge, TableContainer } from "@/components/ui";

interface EmployeeDetail {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  status: string;
  phone?: string;
  address?: string;
  user?: { email: string; role: string };
  attendance?: any[];
  leaveRequests?: any[];
}

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployee(data.employee);
        } else {
          setError("Karyawan tidak ditemukan.");
        }
      } catch (err) {
        console.error("Failed to load employee detail:", err);
        setError("Gagal memuat detail karyawan.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
      ACTIVE: "success",
      INACTIVE: "default",
      TERMINATED: "danger",
      ON_LEAVE: "warning",
    };
    return map[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-red-500 font-bold">{error || "Data karyawan tidak ditemukan"}</p>
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Karyawan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
              NIK: {employee.employeeId}
            </p>
          </div>
        </div>

        <AnimatedBadge variant={getStatusBadge(employee.status)}>
          {getStatusLabel(employee.status)}
        </AnimatedBadge>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Departemen & Jabatan</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.department}</p>
              <p className="text-xs text-slate-500">{employee.position}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Kontak Karyawan</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{employee.user?.email || "-"}</p>
              <p className="text-xs text-slate-500">{employee.phone || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Gaji Pokok (Nominal)</span>
              <p className="text-sm font-extrabold text-teal-700 dark:text-teal-400">
                {employee.salary ? formatCurrency(Number(employee.salary)) : "-"}
              </p>
              <p className="text-[11px] text-slate-400">Tanggal Gabung: {formatDate(employee.hireDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Section */}
      {employee.attendance && employee.attendance.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" /> Riwayat Kehadiran Terakhir
          </h3>
          <TableContainer>
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Tanggal</th>
                  <th className="px-4 py-2.5 text-left">Jam Masuk</th>
                  <th className="px-4 py-2.5 text-left">Jam Pulang</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employee.attendance.map((att: any) => (
                  <tr key={att.id}>
                    <td className="px-4 py-2.5 font-medium">{formatDate(att.date)}</td>
                    <td className="px-4 py-2.5">{att.clockIn ? new Date(att.clockIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                    <td className="px-4 py-2.5">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                    <td className="px-4 py-2.5 font-semibold text-teal-600">{att.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}
