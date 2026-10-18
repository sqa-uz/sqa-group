-- Visitor analytics. Written with IF NOT EXISTS because the app also creates this table
-- on first use (src/lib/analytics.ts), so `prisma migrate deploy` stays safe either way.
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
