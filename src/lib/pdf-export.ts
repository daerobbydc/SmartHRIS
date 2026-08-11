import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { prisma } from "@/lib/prisma";
import { getCompanyInfo, CompanyInfo } from "@/lib/company-config";

// ==================== PDF EXPORT SYSTEM ====================

const DEFAULT_COMPANY: CompanyInfo = {
  name: "PT SmartHRIS Indonesia",
  address: "Jl. Teknologi No. 123, Jakarta Selatan, DKI Jakarta 12930",
  phone: "021-1234-5678",
  email: "info@smarthris.com",
  npwp: "12.345.678.9-012.000",
  hrSignName: "Budi Santoso, M.Psi",
  hrSignTitle: "Head of Human Capital Management",
};

function createHeader(doc: PDFKit.PDFDocument, title: string, company: CompanyInfo = DEFAULT_COMPANY) {
  if (company.letterheadLogo) {
    try {
      const imgData = company.letterheadLogo.startsWith("data:image")
        ? Buffer.from(company.letterheadLogo.split(",")[1], "base64")
        : company.letterheadLogo;

      doc.image(imgData, 50, doc.y, { fit: [495, 65], align: "center" });
      doc.y += 70;
    } catch (e) {
      console.error("Failed to render company letterhead image in PDF, fallback to text header:", e);
      renderTextHeader(doc, company);
    }
  } else {
    renderTextHeader(doc, company);
  }

  doc.moveDown(0.4);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#0d9488").lineWidth(1.5).stroke();
  doc.moveDown(0.5);
  doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
}

function renderTextHeader(doc: PDFKit.PDFDocument, company: CompanyInfo) {
  doc.fontSize(16).font("Helvetica-Bold").text(company.name, { align: "center" });
  doc.fontSize(9).font("Helvetica").text(company.address, { align: "center" });
  doc.text(`Telp: ${company.phone} | Email: ${company.email}`, { align: "center" });
  doc.text(`NPWP: ${company.npwp}`, { align: "center" });
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
 * Generate Payslip PDF matching Indonesian corporate standard layout
 */
export async function generatePayslipPDF(payrollId: string): Promise<Buffer> {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      employee: {
        include: {
          benefits: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  const globalCompany = await getCompanyInfo();
  const emp = payroll.employee;
  const periodMonthStr = new Date(payroll.year, payroll.month - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const empSalary = await prisma.employeeSalary.findUnique({
    where: { employeeId: emp.id },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    createHeader(doc, `SLIP GAJI KARYAWAN - ${periodMonthStr.toUpperCase()}`, globalCompany);

    // Employee Meta Info Table
    const metaTop = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").text("DATA KARYAWAN", 50, metaTop);
    doc.font("Helvetica");

    doc.text(`NIK Karyawan  : ${emp.employeeId}`, 50, metaTop + 15);
    doc.text(`Nama Karyawan : ${emp.firstName} ${emp.lastName}`, 50, metaTop + 28);
    doc.text(`Departemen    : ${emp.department}`, 50, metaTop + 41);
    doc.text(`Jabatan       : ${emp.position}`, 50, metaTop + 54);

    doc.font("Helvetica-Bold").text("INFORMASI PERBANKAN & PAJAK", 300, metaTop);
    doc.font("Helvetica");
    doc.text(`Bank          : ${emp.bankName || empSalary?.bankName || "BCA"}`, 300, metaTop + 15);
    doc.text(`No. Rekening  : ${emp.bankAccount || empSalary?.bankAccount || "-"}`, 300, metaTop + 28);
    doc.text(`NPWP          : ${emp.npwp || empSalary?.npwp || "-"}`, 300, metaTop + 41);
    doc.text(`Status PTKP   : ${emp.ptkp || empSalary?.ptkp || "TK/0"}`, 300, metaTop + 54);

    doc.y = metaTop + 75;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cbd5e1").lineWidth(1).stroke();
    doc.moveDown(0.8);

    // Earnings & Deductions Layout
    const tableTop = doc.y;
    const colWidth = 240;

    // Left Box: EARNINGS
    doc.fillColor("#065f46").fontSize(10).font("Helvetica-Bold").text("PENERIMAAN (EARNINGS)", 50, tableTop);
    doc.fillColor("#000000").fontSize(9).font("Helvetica");

    let leftY = tableTop + 18;
    const addEarningRow = (label: string, val: number) => {
      if (val <= 0 && label !== "Gaji Pokok") return;
      doc.text(label, 50, leftY);
      doc.text(`Rp ${val.toLocaleString("id-ID")}`, 50 + colWidth - 80, leftY, { align: "right", width: 80 });
      leftY += 16;
    };

    addEarningRow("Gaji Pokok", Number(payroll.baseSalary));
    addEarningRow("Tunjangan Jabatan/Operasional", Number(payroll.allowance));
    addEarningRow("Upah Lembur (Overtime)", Number(payroll.overtime));
    addEarningRow("Bonus & Insentif", Number(payroll.bonus));
    addEarningRow("Tunjangan Hari Raya (THR)", Number(payroll.thr));

    // Right Box: DEDUCTIONS
    doc.fillColor("#991b1b").fontSize(10).font("Helvetica-Bold").text("POTONGAN (DEDUCTIONS)", 300, tableTop);
    doc.fillColor("#000000").fontSize(9).font("Helvetica");

    let rightY = tableTop + 18;
    const addDeductionRow = (label: string, val: number) => {
      if (val <= 0) return;
      doc.text(label, 300, rightY);
      doc.text(`Rp ${val.toLocaleString("id-ID")}`, 300 + colWidth - 80, rightY, { align: "right", width: 80 });
      rightY += 16;
    };

    addDeductionRow("PPh 21 TER", Number(payroll.pph21 || payroll.tax));
    addDeductionRow("BPJS JHT (Pekerja 2%)", Number(payroll.bpjsJhtEmployee));
    addDeductionRow("BPJS JP (Pekerja 1%)", Number(payroll.bpjsJpEmployee));
    addDeductionRow("BPJS Kesehatan (Pekerja 1%)", Number(payroll.bpjsKesehatanEmployee));
    addDeductionRow("Potongan Lainnya", Number(payroll.deduction));

    const maxY = Math.max(leftY, rightY) + 10;
    doc.y = maxY;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cbd5e1").lineWidth(1).stroke();

    // Summary Net Salary Banner
    doc.moveDown(0.8);
    const summaryY = doc.y;
    doc.rect(50, summaryY, 495, 35).fillAndStroke("#f0fdf4", "#16a34a");
    doc.fillColor("#166534").fontSize(11).font("Helvetica-Bold").text("TAKE HOME PAY (GAJI BERSIH):", 65, summaryY + 11);
    doc.fillColor("#15803d").fontSize(13).font("Helvetica-Bold").text(`Rp ${Number(payroll.netSalary).toLocaleString("id-ID")}`, 300, summaryY + 10, { align: "right", width: 230 });

    doc.fillColor("#000000");
    doc.moveDown(3);

    // Signatures
    const sigY = doc.y + 15;
    doc.fontSize(9).font("Helvetica").text("Diterima oleh,", 60, sigY);
    doc.text("Disetujui oleh,", 380, sigY);

    doc.moveDown(3.5);
    const nameY = doc.y;
    doc.font("Helvetica-Bold").text(`${emp.firstName} ${emp.lastName}`, 60, nameY);
    doc.font("Helvetica-Bold").text(globalCompany.hrSignName || "Budi Santoso, M.Psi", 380, nameY);
    doc.font("Helvetica").text(globalCompany.hrSignTitle || "Head of Human Capital", 380, nameY + 12);

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

  const globalCompany = await getCompanyInfo();
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
    createHeader(doc, `SPT TAHUNAN PPh 21 TAHUN PAJAK ${year}`, globalCompany);

    doc.fontSize(10).font("Helvetica-Bold").text("DATA PEMBERI KERJA (EMPLOYER)");
    doc.font("Helvetica")
      .text(`NPWP: ${globalCompany.npwp}`)
      .text(`Nama: ${globalCompany.name}`)
      .text(`Alamat: ${globalCompany.address}`);

    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Bold").text("DATA KARYAWAN (EMPLOYEE)");
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
  return generatePaklaringPDF(employeeId);
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

  const globalCompany = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addWatermark(doc, "LAPORAN");

    const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    createHeader(doc, `LAPORAN KEHADIRAN KARYAWAN - ${monthName}`, globalCompany);

    const tableTop = doc.y;
    const colWidths = [30, 120, 80, 80, 80, 80, 80, 120];
    const headers = ["No", "Nama", "Dept", "Tanggal", "Check In", "Check Out", "Status", "Keterangan"];

    doc.fontSize(8).font("Helvetica-Bold");
    let x = 40;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.moveTo(40, doc.y + 5).lineTo(780, doc.y + 5).stroke();

    let y = tableTop + 20;
    doc.font("Helvetica");

    attendance.forEach((att, idx) => {
      if (y > 520) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
        y = 40;
      }

      x = 40;
      doc.text((idx + 1).toString(), x, y, { width: colWidths[0] });
      x += colWidths[0];
      doc.text(`${att.employee.firstName} ${att.employee.lastName}`, x, y, { width: colWidths[1] });
      x += colWidths[1];
      doc.text(att.employee.department, x, y, { width: colWidths[2] });
      x += colWidths[2];
      doc.text(new Date(att.date).toLocaleDateString("id-ID"), x, y, { width: colWidths[3] });
      x += colWidths[3];
      doc.text(att.checkIn ? new Date(att.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-", x, y, { width: colWidths[4] });
      x += colWidths[4];
      doc.text(att.checkOut ? new Date(att.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-", x, y, { width: colWidths[5] });
      x += colWidths[5];
      doc.text(att.status, x, y, { width: colWidths[6] });
      x += colWidths[6];
      doc.text(att.notes || "-", x, y, { width: colWidths[7] });

      y += 15;
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

  let paklaringDoc: Record<string, unknown> | null = null;
  try {
    paklaringDoc = await (prisma as unknown as Record<string, unknown>).paklaringDocument as Record<string, unknown>;
  } catch (e) {
    // Fallback if relation model not present
  }

  const hireDate = employee.hireDate ? new Date(employee.hireDate) : new Date();
  const exitDate = new Date();
  const globalCompany = await getCompanyInfo();

  const companyName = options?.companyName || (paklaringDoc?.companyName as string) || globalCompany.name;
  const docNumber = options?.documentNumber || (paklaringDoc?.documentNumber as string) || `SKK/HRD/${companyName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10)}/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
  const hrName = options?.hrSignName || (paklaringDoc?.hrSignName as string) || globalCompany.hrSignName || "Budi Santoso, M.Psi";
  const hrTitle = options?.hrSignTitle || (paklaringDoc?.hrSignTitle as string) || globalCompany.hrSignTitle || "Head of Human Capital Management";

  const companyInfo: CompanyInfo = {
    ...globalCompany,
    name: companyName,
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

    doc.moveDown(2);

    // Digital Stamp & Verification Badge Box
    const stampY = doc.y + 10;
    doc.rect(50, stampY, 200, 55).strokeColor("#0d9488").lineWidth(1).stroke();
    doc.fillColor("#0d9488").fontSize(8).font("Helvetica-Bold").text("OFFICIAL DIGITAL SEAL & E-SIGN", 60, stampY + 8);
    doc.fillColor("#475569").fontSize(7).font("Helvetica").text(`Verified Doc ID: ${docNumber}`, 60, stampY + 20);
    doc.text(`Signed digitally by HR Department`, 60, stampY + 30);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 60, stampY + 40);

    doc.fillColor("#000000");
    doc.fontSize(10).font("Helvetica").text(`Jakarta, ${formatDateLong(new Date())}`, { align: "right" });
    doc.text(companyName, { align: "right" });
    doc.moveDown(3);
    doc.fontSize(10).font("Helvetica-Bold").text(hrName, { align: "right" });
    doc.font("Helvetica").text(hrTitle, { align: "right" });

    doc.end();
  });
}

/**
 * Generate Surat Perjanjian Kerja (PKWT / PKWTT) PDF
 */
export async function generateContractPDF(contractId: string): Promise<Buffer> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { employee: true },
  });

  if (!contract) {
    throw new Error("Data Kontrak tidak ditemukan");
  }

  const globalCompany = await getCompanyInfo();
  const formatDateLong = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const isPKWT = contract.contractType === "PKWT";
  const titleText = isPKWT
    ? "SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)"
    : "SURAT PERJANJIAN KERJA WAKTU TIDAK TERTENTU (PKWTT)";

  const docNumber = `SPK/${contract.contractType}/${startDate.getFullYear()}/${contract.id.slice(-6).toUpperCase()}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    createHeader(doc, titleText, globalCompany);
    doc.fontSize(9).font("Helvetica").text(`Nomor: ${docNumber}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(9).font("Helvetica").text(
      `Pada hari ini, ${formatDateLong(startDate)}, dibuat dan disepakati Perjanjian Kerja antara para pihak di bawah ini:`,
      { align: "justify" }
    );
    doc.moveDown(0.5);

    // PIHAK PERTAMA
    doc.font("Helvetica-Bold").text("1. PIHAK PERTAMA (PERUSAHAAN):");
    doc.font("Helvetica").text(`   Nama Perusahaan : ${globalCompany.name}`);
    doc.text(`   Alamat          : ${globalCompany.address}`);
    doc.text(`   Perwakilan      : ${globalCompany.hrSignName || "Direksi / HR Management"}`);
    doc.moveDown(0.5);

    // PIHAK KEDUA
    doc.font("Helvetica-Bold").text("2. PIHAK KEDUA (KARYAWAN):");
    doc.font("Helvetica").text(`   Nama Karyawan   : ${contract.employee.firstName} ${contract.employee.lastName}`);
    doc.text(`   ID Karyawan     : ${contract.employee.employeeId}`);
    doc.text(`   Jabatan         : ${contract.position}`);
    doc.text(`   Departemen      : ${contract.employee.department}`);
    doc.moveDown(1);

    doc.font("Helvetica").text("Para Pihak sepakat untuk mengikatkan diri dalam Perjanjian Kerja dengan ketentuan sebagai berikut:", { align: "justify" });
    doc.moveDown(0.8);

    // PASAL 1
    doc.font("Helvetica-Bold").text("PASAL 1: JABATAN DAN MASA KERJA", { align: "center" });
    doc.font("Helvetica").text(
      `1. PIHAK PERTAMA mempekerjakan PIHAK KEDUA sebagai ${contract.position} pada Departemen ${contract.employee.department}.\n` +
      `2. Perjanjian Kerja ini berlaku sejak ${formatDateLong(startDate)} ${isPKWT ? `sampai dengan ${formatDateLong(endDate)}` : "untuk waktu tidak tertentu"}.\n` +
      `3. PIHAK KEDUA bersedia menjalani evaluasi berkala atas kinerjanya.`,
      { lineGap: 3 }
    );
    doc.moveDown(0.8);

    // PASAL 2
    doc.font("Helvetica-Bold").text("PASAL 2: HAK DAN KOMPENSASI GAJI", { align: "center" });
    doc.font("Helvetica").text(
      `1. PIHAK KEDUA berhak menerima Gaji Pokok sebesar Rp ${Number(contract.salary).toLocaleString("id-ID")} per bulan.\n` +
      `2. Pembayaran gaji dilaksanakan pada akhir bulan berjalan sesuai regulasi sistem payroll perusahaan.\n` +
      `3. PIHAK KEDUA berhak mendapatkan kepesertaan BPJS Ketenagakerjaan dan BPJS Kesehatan sesuai ketentuan perundang-undangan.`,
      { lineGap: 3 }
    );
    doc.moveDown(0.8);

    // PASAL 3
    doc.font("Helvetica-Bold").text("PASAL 3: TATA TERTIB & KERAHASIAAN (NDA)", { align: "center" });
    doc.font("Helvetica").text(
      `1. PIHAK KEDUA wajib mematuhi seluruh peraturan perusahaan, jam kerja, dan standar operasional (SOP).\n` +
      `2. PIHAK KEDUA wajib menjaga kerahasiaan data perusahaan, kode sumber, dan informasi finansial selama maupun setelah masa kerja berakhir.`,
      { lineGap: 3 }
    );
    doc.moveDown(1.5);

    // SIGNATURE SECTION
    const sigY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").text("PIHAK PERTAMA", 60, sigY);
    doc.text("PIHAK KEDUA", 380, sigY);

    doc.moveDown(3.5);
    const nameY = doc.y;
    doc.font("Helvetica-Bold").text(globalCompany.name, 60, nameY);
    doc.text(`${contract.employee.firstName} ${contract.employee.lastName}`, 380, nameY);

    doc.end();
  });
}

/**
 * Generate Surat Peringatan (SP 1, SP 2, SP 3) PDF
 */
export async function generateWarningLetterPDF(sanctionId: string): Promise<Buffer> {
  const sanction = await prisma.attendanceSanction.findUnique({
    where: { id: sanctionId },
  });

  const employee = sanction
    ? await prisma.employee.findUnique({ where: { id: sanction.employeeId } })
    : null;

  if (!sanction || !employee) {
    throw new Error("Data Sanksi / Surat Peringatan tidak ditemukan");
  }

  const globalCompany = await getCompanyInfo();
  const formatDateLong = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const spLevel = sanction.type === "WARNING" ? "SURAT PERINGATAN PERTAMA (SP I)" : sanction.type === "FINAL_WARNING" ? "SURAT PERINGATAN KEDUA (SP II)" : "SURAT PERINGATAN KETIGA (SP III)";
  const spNum = `SP/HRD/${new Date(sanction.createdAt).getFullYear()}/${sanction.id.slice(-5).toUpperCase()}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    createHeader(doc, spLevel, globalCompany);
    doc.fontSize(10).font("Helvetica").text(`Nomor: ${spNum}`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).font("Helvetica").text("Surat Peringatan ini ditujukan kepada:", { align: "left" });
    doc.moveDown(0.8);

    const leftCol = 70;
    const valueCol = 180;
    let y = doc.y;

    const details = [
      ["Nama Karyawan", `: ${employee.firstName} ${employee.lastName}`],
      ["ID Karyawan", `: ${employee.employeeId}`],
      ["Departemen", `: ${employee.department}`],
      ["Jabatan", `: ${employee.position}`],
    ];

    details.forEach(([label, val]) => {
      doc.font("Helvetica-Bold").text(label, leftCol, y);
      doc.font("Helvetica").text(val, valueCol, y);
      y += 20;
    });

    doc.y = y + 15;
    doc.font("Helvetica").text(
      `Surat Peringatan ini diterbitkan sehubungan dengan adanya pelanggaran tata tertib perusahaan / disiplin kehadiran, dengan rincian sebagai berikut:\n\n` +
      `Keterangan Pelanggaran: ${sanction.description}\n` +
      `Tanggal Terbit         : ${formatDateLong(new Date(sanction.startDate))}\n` +
      `Masa Berlaku           : 6 (Enam) Bulan sejak tanggal terbit.\n\n` +
      `Apabila dalam masa berlaku Surat Peringatan ini Saudara kembali melakukan pelanggaran disiplin kerja, maka Perusahaan akan memberikan sanksi tingkat berikutnya sesuai peraturan perundang-undangan dan aturan internal perusahaan.\n\n` +
      `Demikian Surat Peringatan ini dibuat untuk diperhatikan dan dijadikan bahan evaluasi diri demi perbaikan kinerja ke depan.`,
      { align: "justify", lineGap: 4 }
    );

    doc.moveDown(3);
    const sigY = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("Atasan / HR Manager", 60, sigY);
    doc.text("Karyawan Bersangkutan", 360, sigY);

    doc.moveDown(3.5);
    const nameY = doc.y;
    doc.font("Helvetica-Bold").text(globalCompany.hrSignName || "HR Manager", 60, nameY);
    doc.text(`${employee.firstName} ${employee.lastName}`, 360, nameY);

    doc.end();
  });
}
