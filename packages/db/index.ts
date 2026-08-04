import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export default globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient());
