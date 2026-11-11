import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to") || process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "support@rolefuse.in";

    const info = await sendTestEmail(to);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${to}! Check your inbox.`,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (error: any) {
    console.error("[Test Email Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send email via SMTP.",
      },
      { status: 500 }
    );
  }
}

