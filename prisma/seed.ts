import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create departments
  const departments = [
    { name: "Human Resources", description: "HR Department" },
    { name: "Engineering", description: "Software Engineering" },
    { name: "Marketing", description: "Marketing & Communications" },
    { name: "Finance", description: "Finance & Accounting" },
    { name: "Operations", description: "Business Operations" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  console.log("Departments created");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@smarthris.com" },
    update: {},
    create: {
      email: "admin@smarthris.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create admin employee
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeId: "EMP-001",
      firstName: "System",
      lastName: "Admin",
      phone: "081234567890",
      department: "Human Resources",
      position: "HR Manager",
      hireDate: new Date("2020-01-01"),
      salary: 15000000,
    },
  });

  // Create HR user
  const hrPassword = await hash("hr123", 12);
  const hrUser = await prisma.user.upsert({
    where: { email: "hr@smarthris.com" },
    update: {},
    create: {
      email: "hr@smarthris.com",
      password: hrPassword,
      role: "HR",
    },
  });

  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: {},
    create: {
      userId: hrUser.id,
      employeeId: "EMP-002",
      firstName: "Jane",
      lastName: "Smith",
      phone: "081234567891",
      department: "Human Resources",
      position: "HR Staff",
      hireDate: new Date("2021-06-15"),
      salary: 10000000,
    },
  });

  // Create employee user (John Doe)
  const empPassword = await hash("employee123", 12);
  const empUser = await prisma.user.upsert({
    where: { email: "employee@smarthris.com" },
    update: {},
    create: {
      email: "employee@smarthris.com",
      password: empPassword,
      role: "EMPLOYEE",
    },
  });

  await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: {},
    create: {
      userId: empUser.id,
      employeeId: "EMP-003",
      firstName: "John",
      lastName: "Doe",
      phone: "081234567892",
      department: "Engineering",
      position: "Software Developer",
      hireDate: new Date("2022-03-01"),
      salary: 12000000,
      nik: "3171012345670003",
      bankName: "BCA",
      bankAccount: "1234567890",
      bankBranch: "Sudirman",
      ptkp: "TK/0",
    },
  });

  // Create demo employee: Andi Pratama (PT Jati Retail Nusantara Payslip Demo)
  const andiUser = await prisma.user.upsert({
    where: { email: "andi.pratama@jatiretail.co.id" },
    update: {},
    create: {
      email: "andi.pratama@jatiretail.co.id",
      password: empPassword,
      role: "EMPLOYEE",
    },
  });

  const andiEmp = await prisma.employee.upsert({
    where: { userId: andiUser.id },
    update: {
      firstName: "Andi",
      lastName: "Pratama",
      department: "Marketing",
      position: "Inter Marketing",
      salary: 1500000,
      nik: "3171012345679021",
      bankName: "BCA",
      bankAccount: "99000",
      bankBranch: "Jakarta",
      ptkp: "TK/0",
    },
    create: {
      userId: andiUser.id,
      employeeId: "EMP-004",
      firstName: "Andi",
      lastName: "Pratama",
      phone: "081299990000",
      department: "Marketing",
      position: "Inter Marketing",
      hireDate: new Date("2025-01-10"),
      salary: 1500000,
      nik: "3171012345679021",
      bankName: "BCA",
      bankAccount: "99000",
      bankBranch: "Jakarta",
      ptkp: "TK/0",
    },
  });

  // Create demo Payroll record for Andi Pratama (Periode Agustus 2025)
  const existingPayroll = await prisma.payroll.findFirst({
    where: {
      employeeId: andiEmp.id,
      month: 8,
      year: 2025,
    },
  });

  if (!existingPayroll) {
    await prisma.payroll.create({
      data: {
        employeeId: andiEmp.id,
        month: 8,
        year: 2025,
        baseSalary: 1500000,
        allowance: 350000, // Transport (200.000) + Uang Makan (150.000)
        overtime: 100000,  // Insentif Kehadiran
        bonus: 0,
        deduction: 0,
        grossIncome: 1950000,
        tax: 0,
        pph21: 0,
        bpjsKesehatanEmployee: 0,
        bpjsKesehatanEmployer: 0,
        bpjsJhtEmployee: 0,
        bpjsJhtEmployer: 0,
        bpjsJpEmployee: 0,
        bpjsJpEmployer: 0,
        bpjsJkk: 0,
        bpjsJkm: 0,
        totalDeduction: 0,
        netSalary: 1950000,
        status: "PAID",
        paidAt: new Date("2025-08-27"),
      },
    });
    console.log("Demo Payroll Andi Pratama Created");
  }

  // Seed Default Salary Components (Komponen Gaji)
  const salaryComponents = [
    {
      name: "Gaji Pokok Magang",
      type: "ALLOWANCE" as const,
      category: "Gaji Pokok",
      amount: 1500000,
      isTaxable: false,
    },
    {
      name: "Tunjangan Transportasi",
      type: "ALLOWANCE" as const,
      category: "Tunjangan Operasional",
      amount: 200000,
      isTaxable: true,
    },
    {
      name: "Uang Makan",
      type: "ALLOWANCE" as const,
      category: "Tunjangan Operasional",
      amount: 150000,
      isTaxable: true,
    },
    {
      name: "Insentif Kehadiran",
      type: "BONUS" as const,
      category: "Insentif & Kehadiran",
      amount: 100000,
      isTaxable: true,
    },
    {
      name: "Gaji Pokok Karyawan Tetap",
      type: "ALLOWANCE" as const,
      category: "Gaji Pokok",
      amount: 5000000,
      isTaxable: true,
    },
    {
      name: "Tunjangan Jabatan / Manajerial",
      type: "ALLOWANCE" as const,
      category: "Tunjangan Struktural",
      amount: 1500000,
      isTaxable: true,
    },
    {
      name: "Potongan BPJS Ketenagakerjaan (JHT + JP)",
      type: "DEDUCTION" as const,
      category: "Asuransi Ketenagakerjaan",
      percentage: 3.0,
      isTaxable: false,
    },
    {
      name: "Potongan BPJS Kesehatan",
      type: "DEDUCTION" as const,
      category: "Asuransi Kesehatan",
      percentage: 1.0,
      isTaxable: false,
    },
    {
      name: "Potongan Pajak PPh 21 TER",
      type: "DEDUCTION" as const,
      category: "Pajak Negara",
      isTaxable: true,
    },
  ];

  for (const comp of salaryComponents) {
    const existing = await prisma.salaryComponent.findFirst({
      where: { name: comp.name },
    });
    if (!existing) {
      await prisma.salaryComponent.create({
        data: comp,
      });
    }
  }
  console.log("Salary components created");

  // Create default office locations
  const officeCount = await prisma.officeLocation.count();
  if (officeCount === 0) {
    await prisma.officeLocation.createMany({
      data: [
        {
          name: "HQ Jakarta (Sudirman Tower)",
          address: "Jl. Jend. Sudirman No. 45, Setiabudi, Jakarta Selatan",
          latitude: -6.2088,
          longitude: 106.8456,
          radiusMeters: 150,
        },
        {
          name: "Cabang Surabaya (Pemuda Plaza)",
          address: "Jl. Pemuda No. 88, Genteng, Surabaya",
          latitude: -7.2654,
          longitude: 112.7483,
          radiusMeters: 200,
        },
        {
          name: "Site Office Bandung",
          address: "Jl. Asia Afrika No. 120, Sumur Bandung, Bandung",
          latitude: -6.9216,
          longitude: 107.6101,
          radiusMeters: 100,
        },
      ],
    });
    console.log("Office locations created");
  }

  // Create default LMS courses
  const lmsCount = await prisma.lmsCourse.count();
  if (lmsCount === 0) {
    await prisma.lmsCourse.create({
      data: {
        title: "SOP & Orientasi Etika Kerja Perusahaan",
        description: "Panduan dasar nilai budaya kerja, kode etik, tata tertib kantor, serta panduan keselamatan kerja bagi seluruh karyawan.",
        category: "Onboarding & HR",
        level: "BEGINNER",
        totalHours: 2,
        isPublished: true,
        modules: {
          create: [
            {
              title: "Modul 1: Standar Operational Procedure & Kebijakan HR",
              contentType: "DOCUMENT",
              durationMin: 20,
              order: 1,
              bodyText: "Selamat datang di pelatihan SOP & Orientasi Etika Kerja. Modul ini membahas mengenai alur pengajuan izin, lembur, dan klaim reimbursement digital, kepatuhan jam kerja, serta standar keselamatan di lingkungan kantor.",
              contentUrl: "/documents/SOP_HR_2026.pdf",
            },
            {
              title: "Modul 2: Video Pelatihan Budaya Kerja & Etika Profesional",
              contentType: "VIDEO",
              durationMin: 30,
              order: 2,
              bodyText: "Video tutorial simulasi situasi kerja sehari-hari, pencegahan konflik internal, dan teknik komunikasi efektif dengan rekan tim.",
              contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              title: "Modul 3: Kuis Pemahaman & Evaluasi Orientasi",
              contentType: "QUIZ",
              durationMin: 15,
              order: 3,
              bodyText: "Tes pemahaman pilihan ganda mengenai standar operasional perusahaan untuk menguji tingkat kesiapan kerja.",
            },
          ],
        },
      },
    });

    await prisma.lmsCourse.create({
      data: {
        title: "Cyber Security & Keamanan Informasi Karyawan",
        description: "Pelatihan pencegahan serangan Phishing, pengamanan password perusahaan, serta proteksi data sensitif.",
        category: "IT & Security",
        level: "INTERMEDIATE",
        totalHours: 3,
        isPublished: true,
        modules: {
          create: [
            {
              title: "Modul 1: Panduan Proteksi Perangkat & VPN Kantor",
              contentType: "DOCUMENT",
              durationMin: 25,
              order: 1,
              bodyText: "Tata cara penggunaan VPN resmi SmartHRIS, verifikasi 2FA, dan manajemen proteksi email korporasi.",
              contentUrl: "/documents/CyberSecurity_Guide.pdf",
            },
            {
              title: "Modul 2: Video Simulasi Serangan Phishing & Social Engineering",
              contentType: "VIDEO",
              durationMin: 35,
              order: 2,
              bodyText: "Video demonstrasi cara mendeteksi email palsu, tautan mencurigakan, dan manipulasi psikologis dari pihak luar.",
              contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            },
            {
              title: "Modul 3: Evaluasi Risiko Keamanan Data",
              contentType: "QUIZ",
              durationMin: 15,
              order: 3,
              bodyText: "Ujian evaluasi kewaspadaan keamanan informasi digital.",
            },
          ],
        },
      },
    });
    console.log("LMS courses created");
  }

  console.log("Users created");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
