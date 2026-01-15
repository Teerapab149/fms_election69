/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "groupImageUrl" TEXT,
ADD COLUMN     "slogan" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_number_key" ON "Candidate"("number");
