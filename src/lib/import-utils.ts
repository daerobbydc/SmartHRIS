import * as XLSX from "xlsx";

export interface ImportTemplate {
  name: string;
  description: string;
  headers: { key: string; label: string; required: boolean; type: "string" | "number" | "date" | "select"; options?: string[] }[];
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
  data?: Record<string, unknown>[];
}

// ==================== TEMPLATES ====================

export const IMPORT_TEMPLATES: Record<string, ImportTemplate> = {
  employees: {
    name: "Data Karyawan",
    description: "Import data karyawan baru",
    headers: [
      { key: "employeeId", label: "ID Karyawan", required: true, type: "string" },
      { key: "firstName", label: "Nama Depan", required: true, type: "string" },
      { key: "lastName", label: "Nama Belakang", required: true, type: "string" },
      { key: "email", label: "Email", required: true, type: "string" },
      { key: "phone", label: "Telepon", required: false, type: "string" },
      { key: "department", label: "Departemen", required: true, type: "string" },
      { key: "position", label: "Jabatan", required: true, type: "string" },
      { key: "hireDate", label: "Tanggal Masuk", required: true, type: "date" },
      { key: "salary", label: "Gaji Pokok", required: true, type: "number" },
      { key: "gender", label: "Jenis Kelamin", required: false, type: "select", options: ["MALE", "FEMALE"] },
      { key: "status", label: "Status", required: false, type: "select", options: ["ACTIVE", "INACTIVE"] },
    ],
  },
  payroll: {
    name: "Data Gaji",
    description: "Import data gaji karyawan",
    headers: [
      { key: "employeeId", label: "ID Karyawan", required: true, type: "string" },
      { key: "baseSalary", label: "Gaji Pokok", required: true, type: "number" },
      { key: "allowance", label: "Tunjangan", required: false, type: "number" },
      { key: "deduction", label: "Potongan", required: false, type: "number" },
      { key: "overtime", label: "Lembur", required: false, type: "number" },
      { key: "bonus", label: "Bonus", required: false, type: "number" },
    ],
  },
  schedule: {
    name: "Jadwal Kerja",
    description: "Import jadwal kerja karyawan",
    headers: [
      { key: "employeeId", label: "ID Karyawan", required: true, type: "string" },
      { key: "scheduleName", label: "Nama Jadwal", required: true, type: "string" },
      { key: "startDate", label: "Tanggal Mulai", required: true, type: "date" },
      { key: "endDate", label: "Tanggal Selesai", required: false, type: "date" },
      { key: "dayOfWeek", label: "Hari (0-6)", required: false, type: "number" },
    ],
  },
  leave: {
    name: "Data Cuti",
    description: "Import data cuti karyawan",
    headers: [
      { key: "employeeId", label: "ID Karyawan", required: true, type: "string" },
      { key: "type", label: "Tipe Cuti", required: true, type: "select", options: ["ANNUAL", "SICK", "PERSONAL", "MATERNITY", "PATERNITY", "UNPAID"] },
      { key: "startDate", label: "Tanggal Mulai", required: true, type: "date" },
      { key: "endDate", label: "Tanggal Selesai", required: true, type: "date" },
      { key: "reason", label: "Alasan", required: false, type: "string" },
    ],
  },
  overtime: {
    name: "Data Lembur",
    description: "Import data lembur karyawan",
    headers: [
      { key: "employeeId", label: "ID Karyawan", required: true, type: "string" },
      { key: "date", label: "Tanggal", required: true, type: "date" },
      { key: "startTime", label: "Jam Mulai", required: true, type: "string" },
      { key: "endTime", label: "Jam Selesai", required: true, type: "string" },
      { key: "hours", label: "Jam", required: true, type: "number" },
      { key: "reason", label: "Alasan", required: true, type: "string" },
    ],
  },
  applicants: {
    name: "Data Pelamar",
    description: "Import data pelamar kerja",
    headers: [
      { key: "vacancyId", label: "ID Lowongan", required: true, type: "string" },
      { key: "name", label: "Nama", required: true, type: "string" },
      { key: "email", label: "Email", required: true, type: "string" },
      { key: "phone", label: "Telepon", required: false, type: "string" },
      { key: "source", label: "Sumber", required: false, type: "string" },
    ],
  },
};

// ==================== PARSE EXCEL ====================

export function parseExcelFile(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
  return data;
}

export function generateTemplateXLSX(templateKey: string): Buffer {
  const template = IMPORT_TEMPLATES[templateKey];
  if (!template) throw new Error("Template not found");

  const headers = template.headers.map((h) => h.label);
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  ws["!cols"] = template.headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, template.name);

  // Add example row with data types info
  const exampleRow = template.headers.map((h) => {
    if (h.type === "date") return "2024-01-15";
    if (h.type === "number") return "5000000";
    if (h.type === "select") return h.options?.[0] || "";
    return "Contoh data";
  });
  XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: 1 });

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

// ==================== VALIDATE & TRANSFORM ====================

export function validateImportData(
  data: Record<string, unknown>[],
  templateKey: string
): ImportResult {
  const template = IMPORT_TEMPLATES[templateKey];
  if (!template) {
    return { success: false, totalRows: 0, successCount: 0, errorCount: 1, errors: [{ row: 0, message: "Template tidak ditemukan" }] };
  }

  const errors: { row: number; message: string }[] = [];
  const validData: Record<string, unknown>[] = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because header is row 1, data starts at row 2
    const rowErrors: string[] = [];

    // Check required fields
    template.headers.forEach((header) => {
      if (header.required && !row[header.label] && !row[header.key]) {
        rowErrors.push(` kolom "${header.label}" wajib diisi`);
      }
    });

    // Validate types
    template.headers.forEach((header) => {
      const value = row[header.label] || row[header.key];
      if (value !== undefined && value !== null && value !== "") {
        if (header.type === "number" && isNaN(Number(value))) {
          rowErrors.push(` kolom "${header.label}" harus berupa angka`);
        }
        if (header.type === "select" && header.options && !header.options.includes(String(value).toUpperCase())) {
          rowErrors.push(` kolom "${header.label}" harus salah satu dari: ${header.options.join(", ")}`);
        }
      }
    });

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join(";") });
    } else {
      // Transform data
      const transformed: Record<string, unknown> = {};
      template.headers.forEach((header) => {
        const value = row[header.label] || row[header.key];
        if (header.type === "number") {
          transformed[header.key] = Number(value) || 0;
        } else if (header.type === "date" && value) {
          transformed[header.key] = new Date(String(value));
        } else if (header.type === "select" && value) {
          transformed[header.key] = String(value).toUpperCase();
        } else {
          transformed[header.key] = value;
        }
      });
      validData.push(transformed);
    }
  });

  return {
    success: errors.length === 0,
    totalRows: data.length,
    successCount: validData.length,
    errorCount: errors.length,
    errors,
    data: validData,
  };
}
