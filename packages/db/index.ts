import { PrismaClient } from "@prisma/client";
import type { ApprovalStatus } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;
