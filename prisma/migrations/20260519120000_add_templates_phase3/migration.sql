-- Phase 3 Step 1: Template System Foundation
-- Adds Template model + SystemConfig.activeTemplateId

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "activeTemplateId" TEXT DEFAULT 'classic';

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authorId" INTEGER,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "forkedFrom" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "pages" JSONB NOT NULL,
    "elements" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT 'v1',
    "archivedYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Template_authorId_idx" ON "Template"("authorId");

-- CreateIndex
CREATE INDEX "Template_isBuiltIn_idx" ON "Template"("isBuiltIn");

-- CreateIndex
CREATE INDEX "Template_isLocked_idx" ON "Template"("isLocked");

-- CreateIndex
CREATE INDEX "Template_forkedFrom_idx" ON "Template"("forkedFrom");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
