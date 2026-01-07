/**
 * Email Template Helper
 * Provides branded email template wrapper with consistent styling
 */

export interface EmailTemplateOptions {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  includeUnsubscribe?: boolean;
  userId?: string;
  notificationType?: string;
}

/**
 * Generate branded email HTML template
 */
export function generateBrandedEmailHTML(options: EmailTemplateOptions): string {
  const {
    title,
    content,
    buttonText,
    buttonUrl,
    footerText,
    includeUnsubscribe = true,
    userId,
    notificationType,
  } = options;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
  const primaryColor = "#0284c7"; // primary-600
  const primaryColorDark = "#0369a1"; // primary-700
  const logoUrl = `${appUrl}/logo.png`; // Update with actual logo URL when available

  // Generate unsubscribe link if needed
  let unsubscribeLink = "";
  if (includeUnsubscribe && userId) {
    const unsubscribeToken = generateUnsubscribeToken(userId, notificationType);
    unsubscribeLink = `${appUrl}/unsubscribe?token=${unsubscribeToken}`;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColorDark} 100%); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                      <span style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">TA</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Tractor Auction</h1>
                    <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">India's Premier Tractor Auction Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px; font-weight: 600;">${title}</h2>
              
              <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>

              ${buttonText && buttonUrl ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${buttonUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      ${footerText || "Thank you for using Tractor Auction Platform!"}
                    </p>
                  </td>
                </tr>
                
                <!-- Contact Info -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="tel:7801094747" style="color: ${primaryColor}; text-decoration: none; font-size: 14px;">📞 7801094747</a>
                        </td>
                        <td style="padding: 0 10px; color: #9ca3af;">|</td>
                        <td style="padding: 0 10px;">
                          <a href="mailto:contact@tractorauction.in" style="color: ${primaryColor}; text-decoration: none; font-size: 14px;">✉️ contact@tractorauction.in</a>
                        </td>
                        <td style="padding: 0 10px; color: #9ca3af;">|</td>
                        <td style="padding: 0 10px;">
                          <a href="${appUrl}" style="color: ${primaryColor}; text-decoration: none; font-size: 14px;">🌐 www.tractorauction.in</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Social Links -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://wa.me/917801094747" style="display: inline-block; width: 32px; height: 32px; background-color: ${primaryColor}; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 16px;">💬</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://www.facebook.com/tractorauction" style="display: inline-block; width: 32px; height: 32px; background-color: ${primaryColor}; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 16px;">f</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://www.instagram.com/tractorauction" style="display: inline-block; width: 32px; height: 32px; background-color: ${primaryColor}; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 16px;">📷</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${includeUnsubscribe && unsubscribeLink ? `
                <!-- Unsubscribe -->
                <tr>
                  <td align="center" style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      <a href="${unsubscribeLink}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from these emails</a>
                    </p>
                  </td>
                </tr>
                ` : ""}

                <!-- Copyright -->
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Tractor Auction. All rights reserved.<br>
                      This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking Pixel (for analytics) -->
  ${userId && notificationType ? `
  <img src="${appUrl}/api/email/track?user=${userId}&type=${notificationType}&event=open" width="1" height="1" style="display:none;" alt="" />
  ` : ""}
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of email
 */
export function generatePlainTextEmail(
  title: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string,
  includeUnsubscribe?: boolean,
  userId?: string,
  notificationType?: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
  
  let text = `Tractor Auction\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `${title}\n\n`;
  text += `${content}\n\n`;
  
  if (buttonText && buttonUrl) {
    text += `${buttonText}: ${buttonUrl}\n\n`;
  }
  
  text += `Contact Us:\n`;
  text += `Phone: 7801094747\n`;
  text += `Email: contact@tractorauction.in\n`;
  text += `Website: ${appUrl}\n\n`;
  
  if (includeUnsubscribe && userId) {
    const unsubscribeToken = generateUnsubscribeToken(userId, notificationType);
    text += `Unsubscribe: ${appUrl}/unsubscribe?token=${unsubscribeToken}\n\n`;
  }
  
  text += `© ${new Date().getFullYear()} Tractor Auction. All rights reserved.\n`;
  text += `This is an automated email. Please do not reply.`;
  
  return text;
}

/**
 * Generate unsubscribe token (using JWT-like approach)
 */
function generateUnsubscribeToken(userId: string, notificationType?: string): string {
  const secret = process.env.JWT_SECRET || "default-secret";
  const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
  const expiresAt = Date.now() + expiresIn;
  const data = {
    userId,
    notificationType: notificationType || "all",
    expiresAt,
  };
  
  // Base64 encode with URL-safe characters
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64").replace(/[+/=]/g, (m) => {
    return { "+": "-", "/": "_", "=": "" }[m] || m;
  });
  
  return encoded;
}

/**
 * Parse unsubscribe token
 */
export function parseUnsubscribeToken(token: string): { userId: string; notificationType?: string } | null {
  try {
    const decoded = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const data = JSON.parse(decoded);
    
    // Check expiration
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return null; // Token expired
    }
    
    return {
      userId: data.userId,
      notificationType: data.notificationType === "all" ? undefined : data.notificationType,
    };
  } catch {
    return null;
  }
}

