import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = params.id;

  try {
    const family = await prisma.family.findFirst({
      where: { members: { some: { id: userId } } },
      include: {
        gotra: true,
        members: true,
        head: true,
      },
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json(family);
  } catch (error) {
    console.error("Error fetching family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  try {
    const newFamily = await prisma.family.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        gotra: { connect: { id: data.gotraId } },
        head: { connect: { id: data.headId } },
        members: { connect: [{ id: data.headId }] },
      },
    });

    return NextResponse.json(newFamily, { status: 201 });
  } catch (error) {
    console.error("Error creating family:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
