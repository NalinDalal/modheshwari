/*
  Warnings:

  - Added the required column `status` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bloodGroup` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL,
DROP COLUMN "bloodGroup",
ADD COLUMN     "bloodGroup" "bloodGroup" NOT NULL;

-- CreateIndex
CREATE INDEX "Profile_bloodGroup_idx" ON "Profile"("bloodGroup");

-- CreateIndex
CREATE INDEX "Profile_status_idx" ON "Profile"("status");
