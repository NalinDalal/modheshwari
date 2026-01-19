import nodemailer, { Transporter } from "nodemailer";

/**
 * Email service - backend only, simple SMTP
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Initialize email transporter
   */
  async init(): Promise<void> {
    if (this.transporter) return;

    const provider = process.env.EMAIL_PROVIDER || "smtp";

    switch (provider) {
      case "smtp":
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "localhost",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        break;

      case "sendgrid":
        // Using nodemailer-sendgrid transport
        this.transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY,
          },
        });
        break;

      case "ses":
        // AWS SES via nodemailer
        const aws = await import("@aws-sdk/client-ses");
        const sesClient = new aws.SES({
          region: process.env.AWS_REGION || "us-east-1",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
          },
        });

        // Use nodemailer-ses-transport or similar
        this.transporter = nodemailer.createTransport({
          SES: { ses: sesClient, aws },
        } as any);
        break;

      default:
        // Fallback to console logging in development
        console.warn("⚠️ No email provider configured, emails will be logged");
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: "unix",
          buffer: true,
        });
    }

    console.log(` Email service initialized (provider: ${provider})`);
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<boolean> {
    await this.init();

    if (!this.transporter) {
      throw new Error("Email transporter not initialized");
    }

    try {
      const from =
        process.env.EMAIL_FROM || "noreply@modheshwari.community";

      let html = options.html;
      let text = options.text;

      // Use template if specified
      if (options.template && options.data) {
        const rendered = this.renderTemplate(options.template, options.data);
        html = rendered.html;
        text = rendered.text;
      }

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text,
        html,
      });

      console.log(`✉️ Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  }

  /**
   * Render email template
   */
  private renderTemplate(
    template: string,
    data: Record<string, any>,
  ): { html: string; text: string } {
    // In production, use a proper template engine like Handlebars or EJS
    switch (template) {
      case "event-registration":
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Event Registration Confirmed</h1>
                </div>
                <div class="content">
                  <p>Dear Community Member,</p>
                  <p>You have successfully registered for <strong>${data.eventName}</strong>.</p>
                  <p><strong>Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> ${data.eventLocation}</p>
                  <p>We look forward to seeing you there!</p>
                  <br>
                  <a href="${process.env.APP_URL}/events" class="button">View Event Details</a>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Event Registration Confirmed\n\nYou have successfully registered for ${data.eventName}.\nDate: ${new Date(data.eventDate).toLocaleDateString()}\nLocation: ${data.eventLocation}`,
        };

      case "resource-request":
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <body>
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Resource Request</h2>
                <p>A new ${data.resourceType} request has been submitted.</p>
                <p><strong>Description:</strong> ${data.description}</p>
                <p><a href="${process.env.APP_URL}/resources" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a></p>
              </div>
            </body>
            </html>
          `,
          text: `New Resource Request\n\nType: ${data.resourceType}\nDescription: ${data.description}`,
        };

      case "generic":
      default:
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <body>
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <p>${data.message || ""}</p>
              </div>
            </body>
            </html>
          `,
          text: data.message || "",
        };
    }
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulk(emails: EmailOptions[]): Promise<number> {
    let successCount = 0;

    for (const email of emails) {
      const success = await this.send(email);
      if (success) successCount++;

      // Rate limiting: wait 100ms between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return successCount;
  }
}

export const emailService = new EmailService();
