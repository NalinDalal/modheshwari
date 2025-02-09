import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ensure it's a user.created event
    if (body.type !== "user.created") {
      return NextResponse.json(
        { message: "Ignoring non-user event" },
        { status: 200 },
      );
    }

    const { id, email_addresses, public_metadata } = body.data;
    const role = public_metadata?.role; // Ensure role is set

    if (role === "family-head") {
      // Create a new family and link it to the user
      const newFamily = await prisma.family.create({
        data: {
          headId: id, // Clerk User ID
          name: `Family of ${email_addresses[0]?.email_address}`,
        },
      });

      // Store familyId in Clerk metadata
      await fetch(`https://api.clerk.dev/v1/users/${id}/metadata`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: { familyId: newFamily.id },
        }),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling Clerk webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
