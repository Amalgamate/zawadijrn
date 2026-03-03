-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "technicalRating" INTEGER NOT NULL DEFAULT 3,
    "behavioralRating" INTEGER NOT NULL DEFAULT 3,
    "collaborationRating" INTEGER NOT NULL DEFAULT 3,
    "overallRating" DECIMAL(3,2) NOT NULL,
    "comments" TEXT,
    "goals" JSONB,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_reviews_userId_idx" ON "performance_reviews"("userId");

-- CreateIndex
CREATE INDEX "performance_reviews_reviewerId_idx" ON "performance_reviews"("reviewerId");

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
