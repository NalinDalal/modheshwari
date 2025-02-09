import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  const auth = getAuth(req);

  if (!auth.userId || auth.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      include: { family: { include: { members: true, gotra: true } } },
    });

    if (!user || !user.family) {
      return res.status(404).json({ message: "Family not found" });
    }

    res.status(200).json(user.family);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
}
