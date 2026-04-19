-- CreateTable: push_subscriptions
-- Stores Web Push API subscriptions so the server can deliver
-- background push notifications to users even when the app is closed.

CREATE TABLE "push_subscriptions" (
    "id"        TEXT        NOT NULL,
    "userId"    TEXT        NOT NULL,
    "endpoint"  TEXT        NOT NULL,
    "p256dh"    TEXT        NOT NULL,
    "auth"      TEXT        NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Each browser endpoint is globally unique
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- Fast lookup of all subscriptions for a given user
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- Referential integrity — cascade delete when user is removed
ALTER TABLE "push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
