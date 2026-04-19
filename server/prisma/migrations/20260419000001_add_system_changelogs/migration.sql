-- CreateTable: system_changelogs
-- Stores versioned system update entries shown in the Communications > Changelog tab.
-- Publishing a changelog entry triggers an in-app + push notification to all users.

CREATE TABLE "system_changelogs" (
    "id"          TEXT         NOT NULL,
    "version"     TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "description" TEXT         NOT NULL,
    "type"        TEXT         NOT NULL DEFAULT 'FEATURE',
    "tags"        TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN      NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_changelogs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_changelogs_isPublished_idx" ON "system_changelogs"("isPublished");
CREATE INDEX "system_changelogs_publishedAt_idx" ON "system_changelogs"("publishedAt");
