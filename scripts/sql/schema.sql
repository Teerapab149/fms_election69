-- scripts/sql/schema.sql — โครงสร้างฐานข้อมูลทั้งหมด สร้างครบในไฟล์เดียว
--
-- ปกติ "ไม่ต้องใช้ไฟล์นี้" — `sh scripts/setup.sh` เรียก `prisma migrate deploy` ให้เอง
-- ซึ่งเป็นทางที่ถูกต้องเพราะมันรู้ว่าฐานข้อมูลอยู่รุ่นไหนแล้ว และอัปเดตต่อได้ในปีถัดไป
--
-- ไฟล์นี้มีไว้สำหรับกรณีที่อยากสร้างตารางด้วย SQL ตรง ๆ เช่น DBA ขอดูก่อนว่าจะสร้างอะไรบ้าง
-- หรือเครื่องที่รัน node ไม่ได้:
--
--   psql "<connection string ของ fms_migrate>" -f scripts/sql/schema.sql
--   psql "<connection string ของ fms_migrate>" -f scripts/sql/ballot-grants.sql
--
-- ⚠️ ถ้าสร้างด้วยไฟล์นี้ ต้องบอก prisma ว่า migration ทั้งหมดถือว่าลงแล้ว ไม่งั้นการอัปเดต
--    ครั้งถัดไปจะพยายามสร้างตารางซ้ำ:
--
--   npx prisma migrate resolve --applied 20251231105732_init_new_database
--   (ทำซ้ำกับทุกชื่อใน prisma/migrations/ ตามลำดับ)
--
-- ไฟล์นี้ generate จาก prisma/schema.prisma ด้วย:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- ถ้า schema เปลี่ยน ให้ generate ใหม่ อย่าแก้ด้วยมือ
--
-- ⚠️ ไฟล์นี้สร้าง "ตารางเปล่า" — ChainHead ต้องมีแถวเริ่มต้นด้วย มิฉะนั้นการลงคะแนนแรกจะพัง
--    (บรรทัด INSERT อยู่ท้ายไฟล์ ใส่ให้แล้ว)

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "facultyId" TEXT,
    "departmentId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "passwordHash" TEXT,
    "gender" TEXT,
    "major" TEXT,
    "titleName" TEXT,
    "subKeyId" TEXT,
    "subMajorId" TEXT,
    "subMajorNameThai" TEXT,
    "year" TEXT,
    "yearStatus" TEXT,
    "isVoted" BOOLEAN NOT NULL DEFAULT false,
    "votedAt" TIMESTAMP(3),
    "isFormCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "modalImageUrl" TEXT,
    "major" TEXT,
    "position" TEXT,
    "candidateId" INTEGER NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "slogan" TEXT,
    "logoUrl" TEXT,
    "color" TEXT,
    "groupImageUrls" JSONB,
    "officialImageUrl" TEXT,
    "mobileHeroImage" JSONB,
    "logoMeaning" TEXT,
    "missions" JSONB,
    "policies" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "seq" SERIAL NOT NULL,
    "payload" TEXT NOT NULL,
    "hourBucket" TEXT,
    "prevHash" TEXT NOT NULL,
    "rowHash" TEXT NOT NULL,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "ChainHead" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "head" TEXT NOT NULL DEFAULT 'GENESIS',
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChainHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isVoteOpen" BOOLEAN NOT NULL DEFAULT false,
    "showResult" BOOLEAN NOT NULL DEFAULT false,
    "systemMode" TEXT NOT NULL DEFAULT 'AUTO',
    "googleFormUrl" TEXT,
    "pageLayout" JSONB,
    "themeConfig" JSONB,
    "globalConfig" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeTemplateId" TEXT DEFAULT 'classic',
    "adminPasswordHash" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_studentId_key" ON "Member"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_name_key" ON "Candidate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_number_key" ON "Candidate"("number");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

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
ALTER TABLE "Member" ADD CONSTRAINT "Member_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ── จุดเริ่มต้นของโซ่บัตร (migration ปกติใส่ให้อัตโนมัติ) ─────────────────────
INSERT INTO "ChainHead" ("id", "head", "seq") VALUES (1, 'GENESIS', 0)
  ON CONFLICT ("id") DO NOTHING;
