-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "dateRange" TEXT,
    "startingBalance" DECIMAL(15,2) NOT NULL,
    "endingBalance" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNRECONCILED',
    "journalItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_schoolId_idx" ON "bank_statements"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_lines_journalItemId_key" ON "bank_statement_lines"("journalItemId");

-- CreateIndex
CREATE INDEX "bank_statement_lines_statementId_idx" ON "bank_statement_lines"("statementId");

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_journalItemId_fkey" FOREIGN KEY ("journalItemId") REFERENCES "journal_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
