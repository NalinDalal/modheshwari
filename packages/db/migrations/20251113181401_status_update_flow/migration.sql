-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'STATUS_UPDATE_REQUEST';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "statusUpdateRequestId" TEXT;

-- CreateTable
CREATE TABLE "StatusUpdateRequest" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT,
    "finalStatus" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "StatusUpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusUpdateApproval" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusUpdateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusUpdateApproval_requestId_approverId_key" ON "StatusUpdateApproval"("requestId", "approverId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_statusUpdateRequestId_fkey" FOREIGN KEY ("statusUpdateRequestId") REFERENCES "StatusUpdateRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdateRequest" ADD CONSTRAINT "StatusUpdateRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdateRequest" ADD CONSTRAINT "StatusUpdateRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdateApproval" ADD CONSTRAINT "StatusUpdateApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StatusUpdateRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusUpdateApproval" ADD CONSTRAINT "StatusUpdateApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
