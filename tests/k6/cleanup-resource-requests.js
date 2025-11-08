#!/usr/bin/env node
/**
 * Cleanup script for test-created ResourceRequest rows.
 * Usage:
 *   TEST_RUN_ID=k6-run-... DATABASE_URL=... node tests/k6/cleanup-resource-requests.js
 *
 * This script connects to the database using Prisma and deletes ResourceRequest
 * records whose `details` field contains the TEST_RUN_ID. It requires
 * `@prisma/client` to be available and DATABASE_URL to be set.
 */

const { PrismaClient } = require("@prisma/client");

async function main() {
  const runId = process.env.TEST_RUN_ID;
  if (!runId) {
    console.error(
      "Missing TEST_RUN_ID environment variable. Example: TEST_RUN_ID=k6-run-...",
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing DATABASE_URL environment variable required by Prisma.",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log(
      `Deleting resource requests with details containing '${runId}'`,
    );
    const res = await prisma.resourceRequest.deleteMany({
      where: {
        details: { contains: runId },
      },
    });
    console.log(`Deleted ${res.count} resource request(s).`);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

main();
