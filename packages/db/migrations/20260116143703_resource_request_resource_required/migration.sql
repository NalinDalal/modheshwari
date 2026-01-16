/*
  Warnings:

  - Made the column `resourceId` on table `ResourceRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."ResourceRequest" DROP CONSTRAINT "ResourceRequest_resourceId_fkey";

-- AlterTable
ALTER TABLE "ResourceRequest" ALTER COLUMN "resourceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
