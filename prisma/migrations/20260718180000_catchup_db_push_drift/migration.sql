-- Catch-up migration (2026-07-18): every column below existed on dev ONLY via
-- `prisma db push` and was missing from migration history — a fresh production
-- `migrate deploy` would build a DB the app cannot run on (no systemMode /
-- googleFormUrl / isFormCompleted / template columns...). Generated with
-- `prisma migrate diff --from-migrations --to-schema-datamodel`; dev marks it
-- applied via `prisma migrate resolve` (its schema is already true).

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "groupImageUrl",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "groupImageUrls" JSONB,
ADD COLUMN     "logoMeaning" TEXT,
ADD COLUMN     "missions" JSONB,
ADD COLUMN     "mobileHeroImage" JSONB,
ADD COLUMN     "officialImageUrl" TEXT,
ADD COLUMN     "policies" JSONB;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "email",
ADD COLUMN     "major" TEXT,
ADD COLUMN     "modalImageUrl" TEXT,
ADD COLUMN     "number" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "globalConfig" JSONB,
ADD COLUMN     "googleFormUrl" TEXT,
ADD COLUMN     "pageLayout" JSONB,
ADD COLUMN     "systemMode" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "themeConfig" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFormCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "subKeyId" TEXT,
ADD COLUMN     "subMajorId" TEXT,
ADD COLUMN     "subMajorNameThai" TEXT,
ADD COLUMN     "titleName" TEXT,
ADD COLUMN     "yearStatus" TEXT;

