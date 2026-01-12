-- CreateEnum
CREATE TYPE "bloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "medicalNotes" TEXT;
