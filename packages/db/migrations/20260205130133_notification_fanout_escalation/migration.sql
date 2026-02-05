-- CreateEnum
CREATE TYPE "FanoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FanoutAudit" (
    "id" TEXT NOT NULL,
    "fanoutId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "channels" TEXT[],
    "message" JSONB,
    "priority" TEXT,
    "status" "FanoutStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedCount" INTEGER,

    CONSTRAINT "FanoutAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FanoutAudit_fanoutId_key" ON "FanoutAudit"("fanoutId");

-- CreateIndex
CREATE INDEX "FanoutAudit_fanoutId_idx" ON "FanoutAudit"("fanoutId");

-- CreateIndex
CREATE INDEX "FanoutAudit_status_idx" ON "FanoutAudit"("status");
