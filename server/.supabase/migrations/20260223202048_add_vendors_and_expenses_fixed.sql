-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "schoolId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendorId" TEXT,
    "accountId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_schoolId_idx" ON "vendors"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_schoolId_name_key" ON "vendors"("schoolId", "name");

-- CreateIndex
CREATE INDEX "expenses_schoolId_idx" ON "expenses"("schoolId");

-- CreateIndex
CREATE INDEX "expenses_vendorId_idx" ON "expenses"("vendorId");

-- CreateIndex
CREATE INDEX "expenses_accountId_idx" ON "expenses"("accountId");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
