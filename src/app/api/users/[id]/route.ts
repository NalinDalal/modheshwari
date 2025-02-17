import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { user } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = params.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gotra: true,
        family: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const userId = params.id;
  const data = await request.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
