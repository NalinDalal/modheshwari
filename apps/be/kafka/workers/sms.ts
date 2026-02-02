import type { EachMessagePayload } from "kafkajs";

import { createConsumer, TOPICS } from "../config";
import type { NotificationEvent } from "../notification-producer";

/**
 * Twilio SMS notification service
 * Sends SMS notifications via Twilio API
 *
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (sender phone)
 */

interface SMSMessage {
  to: string;
  body: string;
  eventId: string;
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(message: SMSMessage): Promise<boolean> {
  try {
    // Check if Twilio SDK is available
    try {
      // @ts-ignore - twilio is optional
      const twilio = await import("twilio");

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.warn("[SMS] Twilio credentials not configured");
        console.log("[SMS] Message dropped — missing credentials. eventId:", message.eventId);
        return false; // Credentials missing, not sent
      }

      const client = twilio(accountSid, authToken);

      const response = await client.messages.create({
        body: message.body,
        from: fromNumber,
        to: message.to,
      });

      console.log(`✓ SMS sent successfully. SID: ${response.sid}`);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Cannot find module")
      ) {
        console.warn(
          "[SMS] twilio SDK not installed. To enable SMS notifications, run: bun add twilio",
        );
        console.log("[SMS] Message dropped — SDK not available. eventId:", message.eventId);
        return false; // SDK not available, not sent
      }
      throw error;
    }
  } catch (error) {
    console.error(
      "[SMS] Failed to send SMS:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Format notification message for SMS (enforce 160-char limit)
 */
function formatSMSBody(event: NotificationEvent): string {
  const prefix = event.type.includes("EVENT") ? "📅" : "📢";
  const usesUnicode = /[^\u0000-\u007F]/.test(prefix);
  const SMS_LIMIT = usesUnicode ? 70 : 160;
  const subject = event.subject || event.type;
  
  // Calculate available space after prefix, separators, and subject
  // Format: "prefix subject: message"
  const prefixAndSeparators = `${prefix} ${subject}: `;
  const availableForMessage = SMS_LIMIT - prefixAndSeparators.length - 3; // -3 for potential "..."
  
  let message = event.message;
  if (availableForMessage > 0) {
    if (message.length > availableForMessage) {
      message = message.substring(0, availableForMessage - 3) + "...";
    }
  } else {
    // Subject is too long, truncate it
    const maxSubjectLen = SMS_LIMIT - `${prefix} : ...`.length;
    message = "...";
    return `${prefix} ${subject.substring(0, maxSubjectLen)}: ${message}`;
  }

  const result = `${prefixAndSeparators}${message}`;
  return result.substring(0, SMS_LIMIT);
}

/**
 * SMS consumer worker
 * Consumes SMS notification events from Kafka and sends them via Twilio
 */
export async function startSmsConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-sms");

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_SMS,
    fromBeginning: false,
  });

  console.log("[SMS] Consumer started, listening for SMS notifications...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        if (!message.value) {
          console.warn("[SMS] Received message with no value");
          return;
        }

        const event = JSON.parse(
          message.value.toString(),
        ) as NotificationEvent & {
          recipientId: string;
          recipientPhone: string;
        };

        // Skip if no phone number
        if (!event.recipientPhone) {
          console.log(
            `[SMS] No phone number for recipient ${event.recipientId}, skipping`,
          );
          return;
        }

        console.log(
          `[SMS] Processing SMS notification for ${event.recipientId}`,
        );

        // Format SMS body
        const smsBody = formatSMSBody(event);

        // Send SMS
        const smsMessage: SMSMessage = {
          to: event.recipientPhone,
          body: smsBody,
          eventId: event.eventId,
        };

        const success = await sendSMS(smsMessage);

        if (success) {
          console.log(
            `✓ Notification ${event.eventId} delivered via SMS to ${event.recipientPhone.slice(-4)}`,
          );
        } else {
          console.error(
            `✗ Failed to send SMS to ${event.recipientId}. Event ID: ${event.eventId}`,
          );
        }
      } catch (error) {
        console.error(
          "[SMS] Error processing message:",
          error instanceof Error ? error.message : error,
        );
      }
    },
  });
}