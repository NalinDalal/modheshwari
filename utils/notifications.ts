import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendNotification(
  userId: string,
  title: string,
  body: string,
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.fcmToken) {
      console.error("User not found or FCM token not available");
      return;
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
    });

    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
