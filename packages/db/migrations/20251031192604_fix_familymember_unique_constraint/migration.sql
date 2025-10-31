/*
  Warnings:

  - A unique constraint covering the columns `[familyId,userId,role]` on the table `FamilyMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyId_userId_role_key" ON "FamilyMember"("familyId", "userId", "role");
