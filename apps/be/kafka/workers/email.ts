import { createConsumer, TOPICS } from "../config";
import type { EachMessagePayload } from "kafkajs";
import type { NotificationEvent } from "../notification-producer";
import { createHash } from "crypto";

/**
 * Email transporter configuration
 * Supports multiple providers: Gmail, SendGrid, AWS SES, or custom SMTP
 */
async function getEmailTransporter() {
  try {
    // @ts-ignore - nodemailer is optional
    const nodemailer = await import("nodemailer");
    
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(
        "[Email] SMTP credentials not configured. Emails will be logged but not sent.",
      );
      // Return a test transporter for development
      return nodemailer.default.createTransport({
        host: "localhost",
        port: 1025,
      });
    }

    return nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } catch (error) {
    console.error("[Email] nodemailer not installed. To enable emails, run: bun add nodemailer");
    return null;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

function toEmailLogId(recipientEmail: string): string {
  if (!recipientEmail) return "unknown-recipient";
  const [local, domain] = recipientEmail.split("@");
  if (!local || !domain) return `${recipientEmail.slice(0, 2)}***`;
  const hash = createHash("sha256").update(recipientEmail).digest("hex").slice(0, 8);
  return `${local.slice(0, 2)}***@${domain}#${hash}`;
}

/**
 * Generate email template based on notification type
 */
function generateEmailTemplate(event: NotificationEvent & { recipientId: string; recipientEmail: string }) {
  const priorityLabel = String(event.priority ?? "unknown").toUpperCase();
  const notificationSubject = escapeHtml(event.subject || "Community Notification");
  const notificationHeading = escapeHtml(event.subject || "Community Update");
  const notificationMessage = escapeHtml(event.message);
  const templates: Record<string, { subject: string; html: string }> = {
    EVENT_APPROVAL: {
      subject: `Event Approval Required: ${escapeHtml(event.message)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Event Approval Required</h2>
          <p>Dear Community Member,</p>
          <p>A new event requires your approval:</p>
          <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #007bff;">
            ${escapeHtml(event.message)}
          </blockquote>
          <p><strong>Priority:</strong> ${priorityLabel}</p>
          <p><a href="${process.env.APP_URL}/events/${event.eventId}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Event</a></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <footer style="color: #666; font-size: 12px;">
            <p>This is an automated notification from Modheshwari Community Platform</p>
          </footer>
        </div>
      `,
    },
    RESOURCE_REQUEST: {
      subject: `Resource Request: ${escapeHtml(event.message)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Resource Request Notification</h2>
          <p>Dear Community Member,</p>
          <p>A resource request has been submitted:</p>
          <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #28a745;">
            ${escapeHtml(event.message)}
          </blockquote>
          <p><strong>Priority:</strong> ${priorityLabel}</p>
          <p><a href="${process.env.APP_URL}/resources" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Requests</a></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <footer style="color: #666; font-size: 12px;">
            <p>This is an automated notification from Modheshwari Community Platform</p>
          </footer>
        </div>
      `,
    },
    NOTIFICATION: {
      subject: notificationSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${notificationHeading}</h2>
          <p>Dear Community Member,</p>
          <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #6c757d;">
            ${notificationMessage}
          </blockquote>
          <p><strong>Priority:</strong> ${priorityLabel}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <footer style="color: #666; font-size: 12px;">
            <p>This is an automated notification from Modheshwari Community Platform</p>
          </footer>
        </div>
      `,
    },
  };

  const typeKey = event.type;
  return templates[typeKey] || templates.NOTIFICATION;
}

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(
  transporter: Awaited<ReturnType<typeof getEmailTransporter>>,
  recipientEmail: string,
  subject: string,
  html: string,
  retries = 3,
): Promise<boolean> {
  if (!transporter) {
    console.log("[Email] Transporter not available, skipping email");
    return false;
  }

  const recipientId = toEmailLogId(recipientEmail);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
        to: recipientEmail,
        subject,
        html,
      });

      console.log(
        `[Email] Sent (recipient: ${recipientId}, messageId: ${info.messageId}, attempt: ${attempt}/${retries})`,
      );
      return true;
    } catch (error) {
      console.error(
        `[Email] Attempt ${attempt}/${retries} failed (recipient: ${recipientId}):`,
        error instanceof Error ? error.message : error,
      );

      if (attempt < retries) {
        // Exponential backoff: 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return false;
}

/**
 * Email consumer worker
 * Consumes email events from Kafka and sends them via SMTP
 */
export async function startEmailConsumer(): Promise<void> {
  const consumer = createConsumer("notifications-email");
  const transporter = await getEmailTransporter();

  if (!transporter) {
    console.warn("[Email] Email worker disabled (nodemailer not installed)");
    return;
  }

  // Verify transporter connection
  try {
    await transporter.verify();
    console.log("[Email] SMTP connection verified ✓");
  } catch (error) {
    console.warn("[Email] SMTP verification failed:", error instanceof Error ? error.message : error);
  }

  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION_EMAIL,
    fromBeginning: false,
  });

  console.log("[Email] Consumer started, listening for email notifications...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        if (!message.value) {
          console.warn("[Email] Received message with no value");
          return;
        }

        const event = JSON.parse(message.value.toString()) as NotificationEvent & {
          recipientId: string;
          recipientEmail: string;
        };

        const recipientLogId = toEmailLogId(event.recipientEmail);
        console.log(`[Email] Processing notification for ${recipientLogId}`);

        // Generate email template
        const template = generateEmailTemplate(event);
        if (!template) {
          console.warn("[Email] No template found for notification type:", event.type);
          return;
        }
        const { subject, html } = template;

        // Send email with retry logic
        const success = await sendEmailWithRetry(transporter, event.recipientEmail, subject, html);

        if (success) {
          console.log(
            `[Email] Notification ${event.eventId} delivered (recipient: ${recipientLogId})`,
          );
        } else {
          console.error(
            `[Email] Failed to send email after retries (recipient: ${recipientLogId}, eventId: ${event.eventId})`,
          );
          // In production, you might want to log this to a DLQ (Dead Letter Queue)
        }
      } catch (error) {
        console.error("[Email] Error processing message:", error instanceof Error ? error.message : error);
      }
    },
  });
}

