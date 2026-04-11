-- Add branding columns to schools table
ALTER TABLE "schools" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "schools" ADD COLUMN "secondaryColor" TEXT;

-- Add missing columns to users table (HR/payroll related fields)
ALTER TABLE "users" ADD COLUMN "shifNumber" TEXT;
ALTER TABLE "users" ADD COLUMN "housingLevyExempt" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "idCardPhoto" TEXT;
ALTER TABLE "users" ADD COLUMN "idCardIssued" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "idCardExpiry" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "bankAccountName" TEXT;
ALTER TABLE "users" ADD COLUMN "basicSalary" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN "subject" TEXT;
ALTER TABLE "users" ADD COLUMN "gender" TEXT;
