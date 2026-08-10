import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace(/\/[^\/]+$/, "/postgres"),
    },
  },
});

async function main() {
  console.log("=== Smart HRIS Database Setup ===\n");

  // Connect using default postgres database to create smarthris database
  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL?.replace(/\/[^\/]+$/, "/postgres"),
      },
    },
  });

  try {
    // Create database if not exists
    await adminPrisma.$executeRawUnsafe(
      `CREATE DATABASE "smarthris" WITH ENCODING 'UTF8'`
    );
    console.log("✓ Database 'smarthris' created successfully");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("✓ Database 'smarthris' already exists");
    } else {
      console.log("Note: Database may already exist or connection issue");
    }
  }
  await adminPrisma.$disconnect();

  // Now connect to smarthris database
  console.log("\nPushing schema to database...");
  console.log("Run: npx prisma db push\n");

  console.log("=== Setup Instructions ===");
  console.log("1. npx prisma db push");
  console.log("2. npm run db:seed");
  console.log("3. npm run dev\n");
  console.log("=== Demo Accounts ===");
  console.log("Admin:    admin@smarthris.com / admin123");
  console.log("HR:       hr@smarthris.com / hr123");
  console.log("Employee: employee@smarthris.com / employee123");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
