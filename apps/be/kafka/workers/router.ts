import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";
import { publishToChannel } from "../notification-producer";
import type { NotificationEvent } from "../notification-producer";
import { scheduleEscalation } from "./escalation";
import prisma from "@modheshwari/db";

/**
 * Retrieve recipient details (email, FCM token, phone, preferences)
 * In production, this would query from database
 */
async function getRecipientDetails(recipientId: string) {
  try {
    // Use shared Prisma client instance

    const user = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { profile: true },
    });

    if (!user) {
      console.warn(`[Router] User ${recipientId} not found`);
      return null;
    }

    return {
      email: user.email,
      fcmToken: user.profile?.fcmToken || null,
      phoneNumber: (user.profile as any)?.phoneNumber || null,
      notificationPreferences: user.profile?.notificationPreferences as Record<string, boolean> | null,
    };
  } catch (error) {
    console.error("[Router] Error fetching recipient details:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Check if recipient has enabled channel in their preferences
 */
function isChannelEnabled(
  channel: string,
  preferences?: Record<string, boolean> | null,
): boolean {
  // Default: all channels enabled if no preferences set
  if (!preferences) return true;

  // Check preference for this channel
  const key = `${channel.toLowerCase()}_enabled`;
  return preferences[key] !== false;
}

/**
 * Router consumer worker
 * Routes notifications to appropriate channels based on:
 * - Delivery strategy (BROADCAST or ESCALATION)
 * - Priority level (CRITICAL always uses broadcast)
 * - User preferences
 * - Channel availability (e.g., has FCM token for push)
 */
export async function startRouterConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-router");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_EVENTS,
    fromBeginning: false,
  });

  console.log("[Router] Consumer started, routing notifications to channels...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        if (!message.value) {
          console.warn("[Router] Received message with no value");
          return;
        }

        const eventData = JSON.parse(message.value.toString());
        if (!eventData || typeof eventData !== "object") {
          console.error("[Router] Invalid notification payload", { eventData });
          return;
        }

        const event: NotificationEvent = eventData;
        const deliveryStrategy = eventData.deliveryStrategy as "BROADCAST" | "ESCALATION" | undefined;
        const notificationPriority = eventData.notificationPriority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
        const notificationId = eventData.notificationId as string | undefined;
        const recipientIds = Array.isArray(eventData.recipientIds)
          ? eventData.recipientIds
          : null;
        const channels = Array.isArray(eventData.channels) ? eventData.channels : null;

        if (!recipientIds || !channels) {
          console.error("[Router] Invalid recipients/channels in payload", { eventData });
          return;
        }

        if (!recipientIds.every((id: unknown) => typeof id === "string" && id.length > 0)) {
          console.error("[Router] Invalid recipientIds in payload", { eventData });
          return;
        }

        if (!channels.every((channel: unknown) => typeof channel === "string" && channel.length > 0)) {
          console.error("[Router] Invalid channels in payload", { eventData });
          return;
        }

        if (deliveryStrategy && !["BROADCAST", "ESCALATION"].includes(deliveryStrategy)) {
          console.error("[Router] Invalid deliveryStrategy in payload", { eventData });
          return;
        }

        if (notificationPriority && !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(notificationPriority)) {
          console.error("[Router] Invalid notificationPriority in payload", { eventData });
          return;
        }

        // Default to BROADCAST strategy
        const strategy = deliveryStrategy || "BROADCAST";
        const priority = notificationPriority || "MEDIUM";

        // Critical notifications always use broadcast
        const useEscalation = strategy === "ESCALATION" && priority !== "CRITICAL";

        console.log(
          `[Router] Processing notification ${event.eventId} (${strategy}/${priority}) with ${recipientIds.length} recipients`
        );

        // Route to each recipient
        for (const recipientId of recipientIds) {
          try {
            // Fetch recipient details
            const recipientDetails = await getRecipientDetails(recipientId);
            if (!recipientDetails) {
              console.warn(`[Router] Skipping unknown recipient: ${recipientId}`);
              continue;
            }

            if (useEscalation) {
              // ESCALATION STRATEGY: In-app first, then schedule SMS and Email
              console.log(`[Router] Using escalation strategy for notification ${event.eventId}`);

              // Always send in-app notification immediately
              if (
                channels.includes("IN_APP") &&
                isChannelEnabled("IN_APP", recipientDetails.notificationPreferences)
              ) {
                await publishToChannel("IN_APP" as any, recipientId, event as any);
                console.log(`[Router] Sent in-app notification to ${recipientId}`);
              }

              // Schedule escalation to SMS and EMAIL if notification is not read
              if (notificationId) {
                const escalationChannels = {
                  email:
                    recipientDetails.email &&
                    isChannelEnabled("EMAIL", recipientDetails.notificationPreferences)
                      ? recipientDetails.email
                      : undefined,
                  sms:
                    recipientDetails.phoneNumber &&
                    isChannelEnabled("SMS", recipientDetails.notificationPreferences)
                      ? recipientDetails.phoneNumber
                      : undefined,
                };

                if (escalationChannels.email || escalationChannels.sms) {
                  await scheduleEscalation(notificationId, escalationChannels);
                } else {
                  console.log(
                    `[Router] No escalation channels enabled for user ${recipientId}, skipping escalation scheduling`,
                  );
                }
              } else {
                console.error(
                  "[Router] Escalation requested but notificationId missing",
                  { eventData },
                );
              }
            } else {
              // BROADCAST STRATEGY: Send to all channels immediately
              console.log(`[Router] Using broadcast strategy for notification ${event.eventId}`);

              for (const channel of channels) {
                // Check if channel is enabled in user preferences
                if (!isChannelEnabled(channel, recipientDetails.notificationPreferences)) {
                  console.log(`[Router] Channel ${channel} disabled for user ${recipientId}, skipping`);
                  continue;
                }

                // Check channel-specific requirements
                if (channel === "PUSH" && !recipientDetails.fcmToken) {
                  console.log(`[Router] No FCM token for user ${recipientId}, skipping push`);
                  continue;
                }

                if (channel === "SMS" && !recipientDetails.phoneNumber) {
                  console.log(`[Router] No phone number for user ${recipientId}, skipping SMS`);
                  continue;
                }

                // Route message to channel topic
                console.log(`[Router] Routing notification ${event.eventId} to ${channel} for ${recipientId}`);

                await publishToChannel(channel as any, recipientId, {
                  ...event,
                  ...(channel === "EMAIL" && { recipientEmail: recipientDetails.email }),
                  ...(channel === "PUSH" && { fcmToken: recipientDetails.fcmToken }),
                  ...(channel === "SMS" && { phoneNumber: recipientDetails.phoneNumber }),
                } as any);
              }
            }
          } catch (error) {
            console.error(
              `[Router] Error routing for recipient ${recipientId}:`,
              error instanceof Error ? error.message : error
            );
            // Continue with next recipient even if one fails
          }
        }

        console.log(`✓ Event ${event.eventId} routed successfully`);
      } catch (error) {
        console.error("[Router] Error processing notification event:", error instanceof Error ? error.message : error);
      }
    },
  });
}