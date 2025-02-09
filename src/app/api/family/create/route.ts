import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.user.role !== "family-head") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, gotra, address } = await req.json();
  if (!name || !gotra || !address) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const family = await prisma.family.create({
      data: {
        name,
        gotra,
        address,
        headId: session.user.id,
      },
    });
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating family" },
      { status: 500 },
    );
  }
}
