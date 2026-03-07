-- CreateTable
CREATE TABLE "staff_attendance_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "date" DATE NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_attendance_logs_schoolId_date_idx" ON "staff_attendance_logs"("schoolId", "date");

-- CreateIndex
CREATE INDEX "staff_attendance_logs_userId_clockInAt_idx" ON "staff_attendance_logs"("userId", "clockInAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_logs_userId_date_key" ON "staff_attendance_logs"("userId", "date");

-- AddForeignKey
ALTER TABLE "staff_attendance_logs" ADD CONSTRAINT "staff_attendance_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance_logs" ADD CONSTRAINT "staff_attendance_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
