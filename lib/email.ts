/**
 * Email service for sending notifications and reports
 * Supports multiple providers (SendGrid, AWS SES, Nodemailer)
 */

interface EmailConfig {
  sendgrid?: {
    apiKey: string;
  };
  nodemailer?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SENDGRID_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );
}

/**
 * Send email using configured provider
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    if (!isEmailConfigured()) {
      console.log(`[CONSOLE MODE] Email to ${to}:\nSubject: ${subject}\n${text || html}`);
      return true; // In console mode, consider it "sent"
    }

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(to, subject, html, text);
    }

    // Try Nodemailer (SMTP)
    if (process.env.SMTP_HOST) {
      return await sendViaSMTP(to, subject, html, text);
    }

    // Try AWS SES
    if (process.env.AWS_ACCESS_KEY_ID) {
      return await sendViaAWS(to, subject, html, text);
    }

    console.log("[CONSOLE MODE] No email provider configured");
    return false;
  } catch (error: any) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.FROM_EMAIL || "noreply@tractorauction.in" },
        subject,
        content: [
          { type: "text/plain", value: text || html },
          { type: "text/html", value: html },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}

/**
 * Send email via SMTP (Nodemailer)
 */
async function sendViaSMTP(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  // For server-side only - would need nodemailer package
  // This is a placeholder - implement when nodemailer is installed
  console.log("SMTP email sending not yet implemented");
  return false;
}

/**
 * Send email via AWS SES
 */
async function sendViaAWS(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  // For server-side only - would need AWS SDK
  // This is a placeholder - implement when AWS SDK is installed
  console.log("AWS SES email sending not yet implemented");
  return false;
}

/**
 * Send report email
 */
export async function sendReportEmail(
  to: string,
  reportType: string,
  reportData: any,
  format: "summary" | "full" = "summary"
): Promise<boolean> {
  const subject = `Tractor Auction - ${reportType} Report`;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .stat-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #2563eb; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tractor Auction Platform</h1>
          <p>${reportType} Report</p>
        </div>
        <div class="content">
          <p>Dear Admin,</p>
          <p>Please find the ${reportType} report below:</p>
  `;

  // Add report-specific content
  if (format === "summary") {
    html += generateSummaryHTML(reportData);
  } else {
    html += generateFullReportHTML(reportData);
  }

  html += `
          <p>Best regards,<br>Tractor Auction Platform</p>
        </div>
        <div class="footer">
          <p>This is an automated report. Generated on ${new Date().toLocaleString()}</p>
          <p>© ${new Date().getFullYear()} Tractor Auction. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
}

function generateSummaryHTML(data: any): string {
  let html = "";
  
  if (data.overview) {
    html += `
      <div class="stat-box">
        <h3>Key Metrics</h3>
        <p><strong>Total Vehicles:</strong> ${data.overview.vehicles?.total || 0}</p>
        <p><strong>Total Auctions:</strong> ${data.overview.auctions?.total || 0}</p>
        <p><strong>Total Users:</strong> ${data.overview.users?.total || 0}</p>
        <p><strong>Total Revenue:</strong> ₹${(data.overview.activity?.totalRevenue || 0).toLocaleString("en-IN")}</p>
      </div>
    `;
  }
  
  return html;
}

function generateFullReportHTML(data: any): string {
  // Generate detailed HTML report
  return generateSummaryHTML(data) + "<p>Full report details...</p>";
}

