/*
  Warnings:

  - Changed the type of `status` on the `EventApproval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `ResourceRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVENT_APPROVAL', 'EVENT_REGISTRATION', 'RESOURCE_REQUEST', 'PAYMENT_RECEIPT', 'GENERIC');

-- AlterTable
ALTER TABLE "EventApproval" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "resourceRequestId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "ResourceRequest" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL;

-- CreateTable
CREATE TABLE "ResourceRequestApproval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "remarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceRequestApproval_requestId_approverId_key" ON "ResourceRequestApproval"("requestId", "approverId");

-- AddForeignKey
ALTER TABLE "ResourceRequestApproval" ADD CONSTRAINT "ResourceRequestApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ResourceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequestApproval" ADD CONSTRAINT "ResourceRequestApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
