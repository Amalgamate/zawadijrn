-- AlterTable
ALTER TABLE "payroll_records" ADD COLUMN     "workedDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workedMinutes" INTEGER NOT NULL DEFAULT 0;
