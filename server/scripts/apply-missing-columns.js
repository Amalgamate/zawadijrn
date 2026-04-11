#!/usr/bin/env node

/**
 * Direct SQL migration script using Prisma
 * Applies missing columns when prisma migrate deploy fails
 */

const path = require('path');

// Import Prisma Client directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sqlStatements = [
  // Add branding columns to schools table
  `ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;`,
  `ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;`,
  
  // Add missing columns to users table (HR/payroll related fields)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shifNumber" TEXT;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "housingLevyExempt" BOOLEAN DEFAULT false;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "idCardPhoto" TEXT;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "idCardIssued" TIMESTAMP;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "idCardExpiry" TIMESTAMP;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "basicSalary" DECIMAL(10,2);`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subject" TEXT;`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" TEXT;`,
];

async function applyMissingColumns() {
  try {
    console.log("📝 Applying missing columns via Prisma...");
    
    for (const sql of sqlStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`✅ ${sql.substring(0, 60).trim()}...`);
      } catch (error) {
        // Column might already exist, that's OK
        if (error.toString().includes('already exists')) {
          console.log(`ℹ️ ${sql.substring(0, 60).trim()}... (already exists)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log("✅ All missing columns have been applied successfully");
    return true;
  } catch (error) {
    console.error("❌ Error applying columns:", error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

applyMissingColumns()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

