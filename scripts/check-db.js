/**
 * SmartHRIS - Database Migration & Setup Script
 * 
 * Run this script after updating the schema:
 * 1. Stop the dev server (Ctrl+C)
 * 2. Run: npx prisma generate
 * 3. Run: npx prisma db push
 * 4. Run: node scripts/seed-new-features.js (optional)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("SmartHRIS - Database Setup\n");

  // Check if models exist
  try {
    await prisma.asset.findMany({ take: 1 });
    console.log("Asset model: OK");
  } catch {
    console.log("Asset model: Not found - Run 'npx prisma db push'");
  }

  try {
    await prisma.contract.findMany({ take: 1 });
    console.log("Contract model: OK");
  } catch {
    console.log("Contract model: Not found - Run 'npx prisma db push'");
  }

  try {
    await prisma.branchOffice.findMany({ take: 1 });
    console.log("BranchOffice model: OK");
  } catch {
    console.log("BranchOffice model: Not found - Run 'npx prisma db push'");
  }

  try {
    await prisma.costCenter.findMany({ take: 1 });
    console.log("CostCenter model: OK");
  } catch {
    console.log("CostCenter model: Not found - Run 'npx prisma db push'");
  }

  try {
    await prisma.reportingLine.findMany({ take: 1 });
    console.log("ReportingLine model: OK");
  } catch {
    console.log("ReportingLine model: Not found - Run 'npx prisma db push'");
  }

  console.log("\nSetup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
