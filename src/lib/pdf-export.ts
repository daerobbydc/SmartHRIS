import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { prisma } from "@/lib/prisma";
import { getCompanyInfo } from "@/lib/company-config";

// ==================== PDF EXPORT SYSTEM ====================

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  npwp: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: "PT SmartHRIS Indonesia",
  address: "Jl. Teknologi No. 123, Jakarta Selatan",
  phone: "021-1234-5678",
  email: "info@smarthris.com",
  npwp: "12.345.678.9-012.000",
};

function createHeader(doc: PDFKit.PDFDocument, title: string, company: CompanyInfo = DEFAULT_COMPANY) {
  doc.fontSize(16).font("Helvetica-Bold").text(company.name, { align: "center" });
  doc.fontSize(9).font("Helvetica").text(company.address, { align: "center" });
  doc.text(`Telp: ${company.phone} | Email: ${company.email}`, { align: "center" });
  doc.text(`NPWP: ${company.npwp}`, { align: "center" });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
}

function addWatermark(doc: PDFKit.PDFDocument, text: string = "CONFIDENTIAL") {
  doc.save();
  doc.fontSize(60).font("Helvetica-Bold").fillColor("#f0f0f0");
  doc.text(text, 150, 400, {
    width: 300,
    align: "center",
  });
  doc.restore();
}

/**
 * Generate Payslip PDF
 */
export async function generatePayslipPDF(payrollId: string): Promise<Buffer> {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: { employee: true },
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addWatermark(doc, "SLIP GAJI");
    createHeader(doc, "SLIP GAJI");

    const emp = payroll.employee;
    doc.fontSize(10).font("Helvetica-Bold").text("DATA KARYAWAN");
    doc.font("Helvetica")
      .text(`Nama: ${emp.firstName} ${emp.lastName}`)
      .text(`NIK: ${emp.nik || "-"}`)
      .text(`Departemen: ${emp.department}`)
      .text(`Jabatan: ${emp.position}`)
      .text(`Periode: ${new Date(payroll.year, payroll.month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`);

    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("PENDAPATAN");
    doc.moveDown(0.3);

    const earnings = [
      { label: "Gaji Pokok", amount: Number(payroll.baseSalary) },
      { label: "Tunjangan", amount: Number(payroll.allowance) },
      { label: "Bonus", amount: Number(payroll.bonus) },
    ];

    earnings.forEach((item) => {
      doc.font("Helvetica")
        .text(item.label, 50, doc.y, { continued: true, width: 350 })
        .text(`Rp ${item.amount.toLocaleString("id-ID")}`, { align: "right" });
    });

    const totalEarnings = earnings.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.font("Helvetica-Bold")
      .text("Total Pendapatan", 50, doc.y + 10, { continued: true, width: 350 })
      .text(`Rp ${totalEarnings.toLocaleString("id-ID")}`, { align: "right" });

    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("POTONGAN");
    doc.moveDown(0.3);

    const deductions = [
      { label: "BPJS Kesehatan", amount: Number(payroll.bpjsKesehatanEmployee) },
      { label: "BPJS Ketenagakerjaan (JHT)", amount: Number(payroll.bpjsJhtEmployee) },
      { label: "BPJS JP", amount: Number(payroll.bpjsJpEmployee) },
      { label: "PPh 21", amount: Number(payroll.pph21) },
    ];

    deductions.forEach((item) => {
      doc.font("Helvetica")
        .text(item.label, 50, doc.y, { continued: true, width: 350 })
        .text(`Rp ${item.amount.toLocaleString("id-ID")}`, { align: "right" });
    });

    const totalDeductions = deductions.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.font("Helvetica-Bold")
      .text("Total Potongan", 50, doc.y + 10, { continued: true, width: 350 })
      .text(`Rp ${totalDeductions.toLocaleString("id-ID")}`, { align: "right" });

    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0d9488");
    doc.text("GAJI BERSIH", 50, doc.y, { continued: true, width: 350 })
      .text(`Rp ${Number(payroll.netSalary).toLocaleString("id-ID")}`, { align: "right" });
    doc.fillColor("black");

    doc.moveDown(2);
    doc.fontSize(8).font("Helvetica").fillColor("#666666");
    doc.text("Dokumen ini digenerate otomatis oleh sistem SmartHRIS.", { align: "center" });
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" });

    doc.end();
  });
}

/**
 * Generate SPT Tahunan PPh 21 PDF
 */
export async function generateSPT21PDF(employeeId: string, year: number): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      payrolls: {
        where: { year },
        orderBy: { month: "asc" },
      },
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Get NPWP from EmployeeSalary
  const empSalary = await prisma.employeeSalary.findUnique({
    where: { employeeId },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addWatermark(doc, "SPT PAJAK");
    createHeader(doc, `SPT TAHUNAN PPh 21 TAHUN PAJAK ${year}`);

    doc.fontSize(10).font("Helvetica-Bold").text("DATA EMPLOYER");
    doc.font("Helvetica")
      .text(`NPWP: ${DEFAULT_COMPANY.npwp}`)
      .text(`Nama: ${DEFAULT_COMPANY.name}`)
      .text(`Alamat: ${DEFAULT_COMPANY.address}`);

    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("DATA EMPLOYE");
    doc.font("Helvetica")
      .text(`NPWP: ${empSalary?.npwp || "-"}`)
      .text(`Nama: ${employee.firstName} ${employee.lastName}`)
      .text(`NIK: ${employee.nik || "-"}`)
      .text(`Alamat: ${employee.address || "-"}`);

    doc.moveDown();

    const payrolls = (employee as unknown as { payrolls: Array<{ grossIncome: number; totalDeduction: number; pph21: number; bpjsKesehatanEmployee: number; bpjsJhtEmployee: number; bpjsJpEmployee: number; month: number }> }).payrolls;
    const totalBruto = payrolls.reduce((sum: number, p: { grossIncome: number }) => sum + Number(p.grossIncome), 0);
    const totalPPh21 = payrolls.reduce((sum: number, p: { pph21: number }) => sum + Number(p.pph21), 0);
    const totalBPJS = payrolls.reduce((sum: number, p: { bpjsKesehatanEmployee: number; bpjsJhtEmployee: number; bpjsJpEmployee: number }) => sum + Number(p.bpjsKesehatanEmployee) + Number(p.bpjsJhtEmployee) + Number(p.bpjsJpEmployee), 0);

    doc.fontSize(10).font("Helvetica-Bold").text("PENGHASILAN BRUTO");
    doc.moveDown(0.3);

    payrolls.forEach((p: { month: number; grossIncome: number; totalDeduction: number }) => {
      const monthName = new Date(year, p.month - 1).toLocaleDateString("id-ID", { month: "short" });
      doc.font("Helvetica")
        .text(`${monthName}: Rp ${Number(p.grossIncome).toLocaleString("id-ID")} - Potongan: Rp ${Number(p.totalDeduction).toLocaleString("id-ID")}`, 70);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.font("Helvetica-Bold")
      .text(`Total Penghasilan Bruto: Rp ${totalBruto.toLocaleString("id-ID")}`, 50, doc.y + 10)
      .text(`Total PPh 21 Dipotong: Rp ${totalPPh21.toLocaleString("id-ID")}`, 50)
      .text(`Total BPJS: Rp ${totalBPJS.toLocaleString("id-ID")}`, 50);

    doc.moveDown(2);
    doc.fontSize(10).font("Helvetica").text(`Jakarta, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`);
    doc.moveDown(2);
    doc.text("_________________________");
    doc.text(`${employee.firstName} ${employee.lastName}`);
    doc.text(`NPWP: ${empSalary?.npwp || "-"}`);

    doc.end();
  });
}

/**
 * Generate SK Keterangan Kerja PDF
 */
export async function generateSKKerjaPDF(employeeId: string): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addWatermark(doc, "SURAT KETERANGAN");
    createHeader(doc, "SURAT KETERANGAN KERJA");

    const skNumber = `SK/${employee.employeeId || "001"}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
    doc.fontSize(10).font("Helvetica").text(`Nomor: ${skNumber}`);
    doc.moveDown();

    doc.text(`Yang bertanda tangan di bawah ini, mewakili ${DEFAULT_COMPANY.name},`);
    doc.moveDown(0.5);
    doc.text("dengan ini menerangkan bahwa:");
    doc.moveDown();

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Nama: ${employee.firstName} ${employee.lastName}`, { indent: 20 });
    doc.font("Helvetica")
      .text(`NIK: ${employee.nik || "-"}`, { indent: 20 })
      .text(`Tempat/Tanggal Lahir: -, ${employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("id-ID") : "-"}`, { indent: 20 })
      .text(`Jabatan: ${employee.position}`, { indent: 20 })
      .text(`Departemen: ${employee.department}`, { indent: 20 })
      .text(`Status: ${employee.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}`, { indent: 20 });

    doc.moveDown();
    doc.text(`adalah benar-benar karyawan di perusahaan kami sejak tanggal ${new Date(employee.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`);
    doc.moveDown();
    doc.text("Surat keterangan ini diberikan atas permintaan yang bersangkutan untuk keperluan:");
    doc.moveDown(0.5);
    doc.text("- Kepentingan administrasi lainnya", { indent: 20 });
    doc.moveDown();
    doc.text("Demikian surat keterangan ini kami buat dengan sebenarnya dan dapat dipergunakan sebagaimana mestinya.");
    doc.moveDown(3);

    doc.text(`Jakarta, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`);
    doc.moveDown(3);
    doc.text("_________________________");
    doc.font("Helvetica-Bold").text("HR Manager");
    doc.font("Helvetica").text(DEFAULT_COMPANY.name);

    doc.end();
  });
}

/**
 * Generate Attendance Report PDF
 */
export async function generateAttendanceReportPDF(month: number, year: number, department?: string): Promise<Buffer> {
  const where: Record<string, unknown> = {
    date: {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    },
  };

  if (department) {
    where.employee = { department };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: { employee: true },
    orderBy: { date: "asc" },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addWatermark(doc, "LAPORAN");

    const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    createHeader(doc, `LAPORAN KEHADIRAN - ${monthName}`);

    const tableTop = doc.y;
    const colWidths = [30, 120, 80, 80, 80, 80, 80, 120];
    const headers = ["No", "Nama", "Dept", "Tanggal", "Check In", "Check Out", "Status", "Keterangan"];

    doc.fontSize(8).font("Helvetica-Bold");
    let x = 40;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: colWidths[i], align: "center" });
      x += colWidths[i];
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(760, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(8);
    attendance.slice(0, 40).forEach((att, idx) => {
      const y = doc.y;
      x = 40;

      const rowData = [
        (idx + 1).toString(),
        `${att.employee.firstName} ${att.employee.lastName}`,
        att.employee.department,
        new Date(att.date).toLocaleDateString("id-ID"),
        att.checkIn ? new Date(att.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        att.checkOut ? new Date(att.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        att.status,
        att.notes || "-",
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, x, y, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });

      doc.moveDown(0.3);
    });

    doc.end();
  });
}

/**
 * Generate Surat Keterangan Kerja (Paklaring) PDF
 */
interface PaklaringOptions {
  documentNumber?: string;
  companyName?: string;
  hrSignName?: string;
  hrSignTitle?: string;
}

export async function generatePaklaringPDF(
  employeeId: string,
  options?: PaklaringOptions
): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Karyawan tidak ditemukan");
  }

  let paklaringDoc: any = null;
  try {
    paklaringDoc = await (prisma as any).paklaringDocument?.findUnique({
      where: { employeeId },
    });
  } catch (e) {
    // Fallback if relation model not present in Prisma Client
  }

  const hireDate = employee.hireDate ? new Date(employee.hireDate) : new Date();
  const exitDate = new Date();

  const globalCompany = await getCompanyInfo();

  const companyName = options?.companyName || paklaringDoc?.companyName || globalCompany.name;
  const docNumber = options?.documentNumber || paklaringDoc?.documentNumber || `SKK/HRD/${companyName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10)}/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
  const hrName = options?.hrSignName || paklaringDoc?.hrSignName || globalCompany.hrSignName || "Budi Santoso, M.Psi";
  const hrTitle = options?.hrSignTitle || paklaringDoc?.hrSignTitle || globalCompany.hrSignTitle || "Head of Human Capital Management";

  const companyInfo: CompanyInfo = {
    name: companyName,
    address: globalCompany.address,
    phone: globalCompany.phone,
    email: globalCompany.email,
    npwp: globalCompany.npwp,
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    createHeader(doc, "SURAT KETERANGAN KERJA", companyInfo);
    doc.fontSize(10).font("Helvetica").text(`Nomor: ${docNumber}`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).font("Helvetica").text(`Yang bertanda tangan di bawah ini atas nama ${companyName} menerangkan bahwa:`, { align: "left" });
    doc.moveDown(1);

    const leftCol = 70;
    const valueCol = 200;
    let y = doc.y;

    const formatDateLong = (d: Date) =>
      d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const details = [
      ["Nama Karyawan", `: ${employee.firstName} ${employee.lastName}`],
      ["ID Karyawan", `: ${employee.employeeId}`],
      ["Departemen", `: ${employee.department}`],
      ["Jabatan Terakhir", `: ${employee.position}`],
      ["Masa Kerja", `: ${formatDateLong(hireDate)} s/d ${formatDateLong(exitDate)}`],
    ];

    details.forEach(([label, val]) => {
      doc.font("Helvetica-Bold").text(label, leftCol, y);
      doc.font("Helvetica").text(val, valueCol, y);
      y += 20;
    });

    doc.y = y + 20;
    doc.font("Helvetica").text(
      `Telah bekerja pada ${companyName} dan menunjukkan dedikasi, loyalitas, serta kontribusi yang baik selama masa kerjanya. ` +
      `Seluruh kewajiban serah terima aset dan administrasi telah diselesaikan dengan baik.\n\n` +
      `Demikian Surat Keterangan Kerja ini diterbitkan untuk dipergunakan sebagaimana mestinya. Kami mengucapkan terima kasih atas jasa dan sumbangsih yang telah diberikan.`,
      { align: "justify", lineGap: 4 }
    );

    doc.moveDown(3);
    doc.fontSize(10).font("Helvetica").text(`Jakarta, ${formatDateLong(new Date())}`, { align: "right" });
    doc.text(companyName, { align: "right" });
    doc.moveDown(3);
    doc.fontSize(10).font("Helvetica-Bold").text(hrName, { align: "right" });
    doc.font("Helvetica").text(hrTitle, { align: "right" });

    doc.end();
  });
}

