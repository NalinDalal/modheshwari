-- DropForeignKey
ALTER TABLE "public"."ResourceRequest" DROP CONSTRAINT "ResourceRequest_resourceId_fkey";

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
