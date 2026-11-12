import { NextResponse } from "next/server";
import { sendContactConfirmationEmail, sendContactAdminAlertEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    // 1. Send auto-reply to user
    // 2. Send notification alert to admin
    await Promise.allSettled([
      sendContactConfirmationEmail({
        to: email,
        name: name || "Customer",
        subject,
        message,
      }),
      sendContactAdminAlertEmail({
        fromName: name || "Anonymous User",
        fromEmail: email,
        subject,
        message,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been received. Check your email for confirmation.",
    });
  } catch (error: any) {
    console.error("[Contact API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process inquiry." },
      { status: 500 }
    );
  }
}

