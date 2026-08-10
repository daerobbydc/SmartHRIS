import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    COMPLETED: "Selesai",
    DRAFT: "Draf",
    ACTIVE: "Aktif",
    INACTIVE: "Tidak Aktif",
    OPEN: "Terbuka",
    CLOSED: "Tutup",
    ON_HOLD: "Ditangguhkan",
    PAID: "Dibayar",
  };
  return labels[status] || status;
}

export function getLeaveTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ANNUAL: "Cuti Tahunan",
    SICK: "Cuti Sakit",
    PERSONAL: "Cuti Pribadi",
    MATERNITY: "Cuti Melahirkan",
    PATERNITY: "Cuti Ayah",
    UNPAID: "Cuti Tanpa Gaji",
  };
  return labels[type] || type;
}

export function getSanctionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WARNING: "Peringatan",
    FINAL_WARNING: "Peringatan Terakhir",
    SUSPENSION: "Suspensi",
    DEMOTION: "Penurunan Jabatan",
  };
  return labels[type] || type;
}

export function getPayrollComponentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ALLOWANCE: "Tunjangan",
    DEDUCTION: "Potongan",
    BONUS: "Bonus",
    BENEFIT: "Benefit",
  };
  return labels[type] || type;
}

export function getVacancyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Kontrak",
    INTERNSHIP: "Magang",
  };
  return labels[type] || type;
}

export function getOKRTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    OBJECTIVE: "Objektif",
    KEY_RESULT: "Hasil Kunci",
  };
  return labels[type] || type;
}

export function getScheduleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    OFFICE: "Jam Kantor",
    SHIFT: "Shift",
    REMOTE: "Remote",
    HYBRID: "Hibrida",
  };
  return labels[type] || type;
}

export function getSubmissionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LEAVE: "Cuti",
    OVERTIME: "Lembur",
    EXPENSE: "Reimbursement",
    DOCUMENT: "Dokumen",
    SCHEDULE_CHANGE: "Ubah Jadwal",
    DATA_CHANGE: "Ubah Data",
    COMPLAINT: "Keluhan",
    SUGGESTION: "Saran",
  };
  return labels[type] || type;
}
