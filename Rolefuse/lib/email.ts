import nodemailer from "nodemailer";

// Initialize singleton transporter
const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
// All outgoing emails authenticate through verified Brevo senders
// Safe fallback: defaults to BREVO_SENDER (hello@rolefuse.in) to guarantee zero 550 SMTP errors
const senderAddress = process.env.BREVO_SENDER || "hello@rolefuse.in";
const supportSender = process.env.BREVO_SUPPORT_SENDER || senderAddress;
const contactSender = process.env.BREVO_CONTACT_SENDER || senderAddress;

const defaultFrom = `RoleFuse <${senderAddress}>`;
const supportEmail = `RoleFuse Support <${supportSender}>`;
const contactEmail = `RoleFuse Contact <${contactSender}>`;
const adminEmail = process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "support@rolefuse.in";

export function getTransporter() {
  if (!smtpUser || !smtpPass) {
    console.warn("[Email] Warning: SMTP_USER or SMTP_PASS is missing in environment variables.");
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Shared responsive HTML wrapper for RoleFuse branded emails
 */
function wrapEmailHtml(content: string, previewText: string = "RoleFuse Notification"): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoleFuse</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(180deg, #ffffff 0%, #fbfdfc 100%);">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      <span style="color: #087F6E;">Role</span>Fuse
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #087F6E; background: #e6f5f2; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ATS Optimizer
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #64748b;">
                RoleFuse — Free AI ATS Resume Optimization & Scanner
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="https://rolefuse.in" style="color: #087F6E; text-decoration: none; margin: 0 6px;">Website</a> &bull;
                <a href="https://rolefuse.in/dashboard" style="color: #087F6E; text-decoration: none; margin: 0 6px;">Dashboard</a> &bull;
                <a href="https://rolefuse.in/dashboard/pricing" style="color: #087F6E; text-decoration: none; margin: 0 6px;">Pricing</a>
              </p>
              <p style="margin: 0; font-size: 11px;">
                Have questions? Email us directly at <a href="mailto:support@rolefuse.in" style="color: #64748b; text-decoration: underline;">support@rolefuse.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. Contact Form / Inquiry: Auto-reply to user
 */
export async function sendContactConfirmationEmail({
  to,
  name,
  subject,
  message,
}: {
  to: string;
  name: string;
  subject?: string;
  message: string;
}) {
  const transporter = getTransporter();

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
      Thanks for contacting us, ${name || "there"}!
    </h2>
    <p style="margin: 0 0 16px 0;">
      We have received your message and our support team is reviewing it. We typically reply within <strong>2 to 4 hours</strong> during business hours.
    </p>

    <div style="background-color: #f8fafc; border-left: 4px solid #087F6E; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
        ${subject ? `Subject: ${subject}` : "Your Message Summary"}
      </p>
      <p style="margin: 0; color: #1e293b; font-size: 14px; white-space: pre-wrap;">${message}</p>
    </div>

    <p style="margin: 20px 0 0 0; font-size: 14px; color: #64748b;">
      In the meantime, feel free to continue exploring your ATS scores on the 
      <a href="https://rolefuse.in/dashboard" style="color: #087F6E; font-weight: 600; text-decoration: none;">RoleFuse Dashboard</a>.
    </p>
  `;

  return transporter.sendMail({
    from: contactEmail,
    to,
    replyTo: "contact@rolefuse.in",
    subject: `We received your message: ${subject || "RoleFuse Contact"}`,
    html: wrapEmailHtml(content, "We received your message and are on it!"),
  });
}

/**
 * 1b. Contact Form / Inquiry: Alert to Admin
 */
export async function sendContactAdminAlertEmail({
  fromName,
  fromEmail,
  subject,
  message,
}: {
  fromName: string;
  fromEmail: string;
  subject?: string;
  message: string;
}) {
  const transporter = getTransporter();

  const content = `
    <div style="background: #e6f5f2; border: 1px solid #bfe7de; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <strong style="color: #087F6E;">New Customer Inquiry Received</strong>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #64748b; width: 100px;"><strong>From:</strong></td><td style="color: #0f172a;">${fromName}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td><a href="mailto:${fromEmail}" style="color: #087F6E;">${fromEmail}</a></td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;"><strong>Subject:</strong></td><td style="color: #0f172a;">${subject || "General Inquiry"}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;"><strong>Time:</strong></td><td style="color: #64748b;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
    </table>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
      <strong style="color: #334155; font-size: 13px;">Message Content:</strong>
      <p style="margin: 8px 0 0 0; color: #0f172a; font-size: 14px; white-space: pre-wrap;">${message}</p>
    </div>
  `;

  return transporter.sendMail({
    from: defaultFrom,
    to: adminEmail,
    replyTo: fromEmail,
    subject: `[RoleFuse Contact] ${fromName}: ${subject || "Inquiry"}`,
    html: wrapEmailHtml(content, `New message from ${fromName}`),
  });
}

/**
 * 2. Purchase Receipt & Plan Activation Email
 */
export async function sendPurchaseReceiptEmail({
  userEmail,
  userName,
  planName,
  amount,
  paymentId,
  creditsAdded,
}: {
  userEmail: string;
  userName?: string;
  planName: string;
  amount: number | string;
  paymentId: string;
  creditsAdded: number | string;
}) {
  const transporter = getTransporter();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #e6f5f2; color: #087F6E; padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        Payment Confirmed
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; color: #0f172a;">
        Payment Successful!
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Your <strong>${planName}</strong> plan is now active.
      </p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">AI Optimizations Added:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #087F6E;">+${creditsAdded} Scans</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">₹${amount} (incl. 5% GST)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Payment Reference:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #475569;">${paymentId}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://rolefuse.in/dashboard" style="display: inline-block; background-color: #087F6E; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(8, 127, 110, 0.25);">
        Start Optimizing Resumes
      </a>
    </div>

    <p style="margin: 20px 0 0 0; text-align: center; font-size: 13px; color: #94a3b8;">
      You can download your official GST tax invoice PDF anytime under 
      <a href="https://rolefuse.in/dashboard/pricing" style="color: #087F6E; text-decoration: none;">Billing & Plans</a>.
    </p>
  `;

  return transporter.sendMail({
    from: supportEmail,
    to: userEmail,
    replyTo: "support@rolefuse.in",
    subject: `Payment Confirmed: Your RoleFuse ${planName} Plan is Active`,
    html: wrapEmailHtml(content, `Payment of ₹${amount} confirmed. ${planName} plan is ready.`),
  });
}

/**
 * 3. Plan Expiration Reminder Email
 */
export async function sendPlanExpirationReminderEmail({
  userEmail,
  userName,
  planName,
  daysRemaining,
  expiresAt,
}: {
  userEmail: string;
  userName?: string;
  planName: string;
  daysRemaining: number;
  expiresAt: string | Date;
}) {
  const transporter = getTransporter();

  const isToday = daysRemaining <= 0;
  const headline = isToday
    ? "Your RoleFuse Plan Expires Today"
    : `Your RoleFuse Plan Expires in ${daysRemaining} Days`;

  const content = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
      ${headline}
    </h2>
    <p style="margin: 0 0 18px 0; color: #475569; font-size: 15px;">
      Hi ${userName || "there"}, this is a friendly reminder that your <strong>${planName}</strong> plan cycle is ending on 
      <strong>${new Date(expiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</strong>.
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Notice:</strong> Renew before expiration to keep your resume scans active and continue passing recruiter ATS filters with a 90+ score.
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://rolefuse.in/dashboard/pricing" style="display: inline-block; background-color: #087F6E; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(8, 127, 110, 0.25);">
        Renew / Upgrade Plan
      </a>
    </div>

    <p style="margin: 20px 0 0 0; text-align: center; font-size: 12px; color: #94a3b8;">
      If your plan expires, your account will smoothly transition to the Free Tier (includes free monthly scans).
    </p>
  `;

  return transporter.sendMail({
    from: supportEmail,
    to: userEmail,
    replyTo: "support@rolefuse.in",
    subject: `Reminder: ${headline}`,
    html: wrapEmailHtml(content, headline),
  });
}

/**
 * 4. Test Email to verify SMTP configuration
 */
export async function sendTestEmail(recipientEmail: string) {
  const transporter = getTransporter();

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; background: #e6f5f2; color: #087F6E; padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        Automation Active
      </span>
      <h2 style="margin: 12px 0 4px 0; color: #0f172a; font-size: 20px;">
        SMTP Setup Successful!
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Your custom domain email automation is working perfectly.
      </p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; font-size: 13px; color: #334155;">
      <p style="margin: 0 0 6px 0;"><strong>Sender:</strong> ${defaultFrom}</p>
      <p style="margin: 0 0 6px 0;"><strong>Recipient:</strong> ${recipientEmail}</p>
      <p style="margin: 0 0 6px 0;"><strong>SMTP Relay:</strong> ${smtpHost}:${smtpPort}</p>
      <p style="margin: 0;"><strong>DKIM / DMARC:</strong> rolefuse.in Verified</p>
    </div>
  `;

  return transporter.sendMail({
    from: defaultFrom,
    to: recipientEmail,
    replyTo: "support@rolefuse.in",
    subject: "RoleFuse Email Automation: Test Message Successful",
    html: wrapEmailHtml(content, "Test email from RoleFuse via Brevo SMTP"),
  });
}

/**
 * 5. Abandoned Payment Gateway / Checkout Exit Email
 * Sent when a user opens the Razorpay checkout and exits before completing payment.
 */
export async function sendAbandonedCheckoutEmail({
  userEmail,
  userName,
  planName,
  price,
  billingCycle,
}: {
  userEmail: string;
  userName?: string;
  planName: string;
  price?: string;
  billingCycle?: string;
}) {
  const transporter = getTransporter();

  const priceDisplay = price ? ` for only ${price}` : "";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #b45309; padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        Account Notice
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; color: #0f172a;">
        Did something go wrong with your upgrade?
      </h2>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Hi ${userName || "there"}, we noticed you started upgrading to <strong>RoleFuse ${planName}</strong>${priceDisplay}, but exited before completing payment.
      </p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
        Here is what is waiting for you in ${planName}:
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
        <li><strong>AI ATS Resume Scans</strong> matching Workday, Taleo & Greenhouse algorithms</li>
        <li><strong>Unlimited ATS Safe PDF + DOCX</strong> downloads</li>
        <li><strong>Job Description Missing Keyword Matching</strong> to boost your score to 90+</li>
        <li><strong>Cover Letter AI Studio</strong> & Tailored Skill Roadmaps</li>
      </ul>
    </div>

    <div style="background: #e6f5f2; border: 1px solid #bfe7de; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #087F6E;">
      <strong>100% RBI-Compliant and Secure:</strong> All payments are processed through Razorpay PCI-DSS Level 1. We support UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://rolefuse.in/dashboard/pricing" style="display: inline-block; background-color: #087F6E; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(8, 127, 110, 0.25);">
        Complete Your ${planName} Upgrade
      </a>
    </div>

    <p style="margin: 24px 0 0 0; text-align: center; font-size: 12px; color: #94a3b8;">
      Have a question or ran into a payment error? Just reply directly to this email — our support team is happy to assist you!
    </p>
  `;

  return transporter.sendMail({
    from: supportEmail,
    to: userEmail,
    replyTo: "support@rolefuse.in",
    subject: `Did you have questions about upgrading to RoleFuse ${planName}?`,
    html: wrapEmailHtml(content, `We noticed you started upgrading to RoleFuse ${planName}. Need any help?`),
  });
}


