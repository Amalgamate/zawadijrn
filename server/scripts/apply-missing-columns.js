#!/usr/bin/env node
const { Pool } = require('pg');

/**
 * Direct SQL migration script to add missing columns
 * This bypasses Prisma and applies SQL directly, ensuring columns are created
 * Used when prisma migrate deploy fails or takes too long
 */

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("❌ DIRECT_URL environment variable not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: directUrl });

const missingColumnsSql = `
-- Add branding columns to schools table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'primaryColor') THEN
    ALTER TABLE "schools" ADD COLUMN "primaryColor" TEXT;
    RAISE NOTICE 'Added schools.primaryColor';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'secondaryColor') THEN
    ALTER TABLE "schools" ADD COLUMN "secondaryColor" TEXT;
    RAISE NOTICE 'Added schools.secondaryColor';
  END IF;
END $$;

-- Add missing columns to users table (HR/payroll related fields)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'shifNumber') THEN
    ALTER TABLE "users" ADD COLUMN "shifNumber" TEXT;
    RAISE NOTICE 'Added users.shifNumber';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'housingLevyExempt') THEN
    ALTER TABLE "users" ADD COLUMN "housingLevyExempt" BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added users.housingLevyExempt';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'idCardPhoto') THEN
    ALTER TABLE "users" ADD COLUMN "idCardPhoto" TEXT;
    RAISE NOTICE 'Added users.idCardPhoto';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'idCardIssued') THEN
    ALTER TABLE "users" ADD COLUMN "idCardIssued" TIMESTAMP;
    RAISE NOTICE 'Added users.idCardIssued';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'idCardExpiry') THEN
    ALTER TABLE "users" ADD COLUMN "idCardExpiry" TIMESTAMP;
    RAISE NOTICE 'Added users.idCardExpiry';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bankAccountName') THEN
    ALTER TABLE "users" ADD COLUMN "bankAccountName" TEXT;
    RAISE NOTICE 'Added users.bankAccountName';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'basicSalary') THEN
    ALTER TABLE "users" ADD COLUMN "basicSalary" DECIMAL(10,2);
    RAISE NOTICE 'Added users.basicSalary';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subject') THEN
    ALTER TABLE "users" ADD COLUMN "subject" TEXT;
    RAISE NOTICE 'Added users.subject';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
    ALTER TABLE "users" ADD COLUMN "gender" TEXT;
    RAISE NOTICE 'Added users.gender';
  END IF;
END $$;
`;

async function applyMissingColumns() {
  const client = await pool.connect();
  try {
    console.log("📝 Applying missing columns migration...");
    const result = await client.query(missingColumnsSql);
    console.log("✅ All missing columns have been added (or already existed)");
    return true;
  } catch (error) {
    console.error("❌ Error applying columns:", error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
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
