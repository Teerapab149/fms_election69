-- AdminAuditLog existed on dev only via `prisma db push` (no migration), so a
-- production `migrate deploy` would silently skip it and the best-effort audit
-- writes in /api/admin/dashboard would no-op forever. This backfills the
-- migration; dev marks it applied via `prisma migrate resolve`.

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
