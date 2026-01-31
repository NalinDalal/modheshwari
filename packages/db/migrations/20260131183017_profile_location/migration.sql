-- DropIndex
DROP INDEX "public"."Profile_locationGeo_idx";

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "locationUpdatedAt" SET DATA TYPE TIMESTAMP(3);
