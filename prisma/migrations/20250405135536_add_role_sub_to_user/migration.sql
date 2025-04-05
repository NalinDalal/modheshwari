/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email,sub]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'FAMILY_HEAD', 'SUBCOMMUNITY_HEAD', 'SUBHEAD_OF_COMMUNITY', 'HEAD_OF_COMMUNITY', 'ADMIN', 'SUBADMIN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'google',
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "sub" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_sub_key" ON "User"("email", "sub");
