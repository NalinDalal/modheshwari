import prisma from "@modheshwari/db";
import { verifyAuth } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/index";

type MedicalBody = {
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
};

// ---------------- UPDATE MEDICAL INFO ----------------
export async function handleUpdateMedical(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const body = (await req.json()) as MedicalBody;
  if (!body.bloodGroup && !body.allergies && !body.medicalNotes) {
    return failure("No medical info provided", null, 400);
  }

  try {
    const updated = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { ...body },
      create: { userId: user.id, ...body },
    });

    return success("Medical info updated", { profile: updated });
  } catch (err) {
    console.error("Failed to update medical info:", err);
    return failure("Internal server error", null, 500);
  }
}
