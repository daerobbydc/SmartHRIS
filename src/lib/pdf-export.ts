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

  // Get Employee Salary & Bank info
  const empSalary = await prisma.employeeSalary.findUnique({
    where: { employeeId: emp.id },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // 1. Company Header
    doc.fontSize(16).font("Helvetica-Bold").text(globalCompany.name, { align: "center" });
    doc.fontSize(9).font("Helvetica").text(globalCompany.address, { align: "center" });
    doc.moveDown(0.8);

    doc.fontSize(11).font("Helvetica-Bold").text(`Slip Gaji Periode ${periodMonthStr}`, { align: "left" });
    doc.moveDown(0.4);

    // Horizontal Divider Line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.8).strokeColor("#333333").stroke();
    doc.moveDown(0.8);

    // 2. Employee Details Grid (2 Columns)
    const leftColX = 40;
    const rightColX = 310;
    let gridY = doc.y;

    const paidAtDate = payroll.paidAt
      ? new Date(payroll.paidAt).toLocaleDateString("id-ID")
      : new Date().toLocaleDateString("id-ID");

    // Left Column Info
    doc.font("Helvetica").fontSize(9);
    doc.text("Nama", leftColX, gridY).text(`: ${emp.firstName} ${emp.lastName}`, leftColX + 80, gridY);
    gridY += 14;
    doc.text("Departemen", leftColX, gridY).text(`: ${emp.department}`, leftColX + 80, gridY);
    gridY += 14;
    doc.text("Jabatan", leftColX, gridY).text(`: ${emp.position}`, leftColX + 80, gridY);
    gridY += 14;
    doc.text("Tanggal Gajian", leftColX, gridY).text(`: ${paidAtDate}`, leftColX + 80, gridY);

    // Right Column Info
    let rightY = doc.y - 42;
    const bpjsTkNum = emp.nik ? `ID/MB/${emp.nik.slice(-4)}` : "-";
    const bpjsKesNum = emp.nik ? emp.nik.slice(0, 4) : "-";
    const bankAccountStr = emp.bankAccount || empSalary?.bankAccount || "-";

    doc.text("No. BPJS Ketenagakerjaan", rightColX, rightY).text(`: ${bpjsTkNum}`, rightColX + 130, rightY);
    rightY += 14;
    doc.text("No. BPJS Kesehatan", rightColX, rightY).text(`: ${bpjsKesNum}`, rightColX + 130, rightY);
    rightY += 14;
    doc.text("Hari Kerja", rightColX, rightY).text(": 22", rightColX + 130, rightY);
    rightY += 14;
    doc.text("Rekening Bank", rightColX, rightY).text(`: ${bankAccountStr}`, rightColX + 130, rightY);

    doc.y = Math.max(gridY, rightY) + 12;

    // Horizontal Divider Line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.8).strokeColor("#333333").stroke();
    doc.moveDown(0.8);

    // 3. Two Column Table (Pendapatan vs Potongan)
    const tableY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).text("Pendapatan", leftColX, tableY);
    doc.text("Potongan", rightColX, tableY);

    let curEarningsY = tableY + 18;
    let curDeductionsY = tableY + 18;

    const baseSalaryNum = Number(payroll.baseSalary);
    const allowanceNum = Number(payroll.allowance);
    const overtimeNum = Number(payroll.overtime);
    const bonusNum = Number(payroll.bonus) + Number(payroll.thr);

    const earningsItems = [
      { label: "Gaji Pokok", amount: baseSalaryNum },
      { label: "Tunjangan Transportasi", amount: allowanceNum > 0 ? Math.round(allowanceNum * 0.6) : 0 },
      { label: "Uang Makan", amount: allowanceNum > 0 ? Math.round(allowanceNum * 0.4) : 0 },
      { label: "Insentif / Lembur", amount: overtimeNum + bonusNum },
    ].filter((i) => i.amount >= 0);

    earningsItems.forEach((item) => {
      doc.font("Helvetica").fontSize(9);
      doc.text(item.label, leftColX, curEarningsY);
      doc.text(`: Rp${item.amount.toLocaleString("id-ID")}`, leftColX + 120, curEarningsY);
      curEarningsY += 14;
    });

    const pph21Num = Number(payroll.pph21) || Number(payroll.tax);
    const bpjsTkEmpNum = Number(payroll.bpjsJhtEmployee) + Number(payroll.bpjsJpEmployee);
    const bpjsKesEmpNum = Number(payroll.bpjsKesehatanEmployee);

    const deductionsItems = [
      { label: "Pajak PPh 21", amount: pph21Num },
      { label: "BPJS Ketenagakerjaan", amount: bpjsTkEmpNum },
      { label: "BPJS Kesehatan", amount: bpjsKesEmpNum },
    ];

    deductionsItems.forEach((item) => {
      doc.font("Helvetica").fontSize(9);
      doc.text(item.label, rightColX, curDeductionsY);
      doc.text(`: Rp${item.amount.toLocaleString("id-ID")}`, rightColX + 130, curDeductionsY);
      curDeductionsY += 14;
    });

    const maxY = Math.max(curEarningsY, curDeductionsY) + 10;
    doc.y = maxY;

    // Horizontal Divider Line
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.8).strokeColor("#333333").stroke();
    doc.moveDown(0.8);

    // 4. Totals Breakdown
    const totalEarningsNum = Number(payroll.grossIncome) || earningsItems.reduce((a, b) => a + b.amount, 0);
    const totalDeductionsNum = Number(payroll.totalDeduction) || deductionsItems.reduce((a, b) => a + b.amount, 0);
    const netSalaryNum = Number(payroll.netSalary);

    let totalsY = doc.y;
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Total Pendapatan", leftColX, totalsY);
    doc.text(`:Rp${totalEarningsNum.toLocaleString("id-ID")}`, leftColX + 120, totalsY);

    doc.text("Total Potongan", rightColX, totalsY);
    doc.text(`: Rp${totalDeductionsNum.toLocaleString("id-ID")}`, rightColX + 130, totalsY);
    totalsY += 18;

    doc.text("Gaji Bersih", rightColX, totalsY);
    doc.text(`: Rp${netSalaryNum.toLocaleString("id-ID")}`, rightColX + 130, totalsY);

    // 5. Signature Block
    doc.y = totalsY + 40;
    const signY = doc.y;
    doc.font("Helvetica").fontSize(9);
    doc.text(`Jakarta, ${paidAtDate}`, 380, signY, { align: "right" });
    doc.text("Manager", 380, signY + 30, { align: "right" });

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

    doc.moveDown(2);

    // Digital Stamp & Verification Badge Box
    const stampY = doc.y + 10;
    doc.rect(50, stampY, 200, 55).strokeColor("#0d9488").lineWidth(1).stroke();
    doc.fillColor("#0d9488").fontSize(8).font("Helvetica-Bold").text("OFFICIAL DIGITAL SEAL & E-SIGN", 60, stampY + 8);
    doc.fillColor("#475569").fontSize(7).font("Helvetica").text(`Verified Doc ID: ${docNumber}`, 60, stampY + 20);
    doc.text(`Signed digitally by HR Department`, 60, stampY + 30);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 60, stampY + 40);

    doc.fillColor("#000000"); // Reset color
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


