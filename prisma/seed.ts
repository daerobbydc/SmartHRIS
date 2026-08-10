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

  // Create employee user
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
    },
  });

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
