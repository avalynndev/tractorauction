import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * SendGrid Webhook Handler
 * Receives events from SendGrid (delivered, opened, clicked, bounced, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    // SendGrid sends events as an array
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { message: "Invalid webhook data" },
        { status: 400 }
      );
    }

    // Process each event
    for (const event of events) {
      try {
        const {
          email,
          event: eventType,
          timestamp,
          sg_event_id,
          sg_message_id,
          useragent,
          ip,
          url, // For click events
          reason, // For bounce/spam events
          status, // For processed events
        } = event;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (!user) {
          continue; // Skip if user not found
        }

        // Extract notification type from custom args or email subject
        // SendGrid allows custom args in the email send request
        const notificationType = event.notification_type || "unknown";

        // Record email event
        await prisma.emailEvent.create({
          data: {
            userId: user.id,
            email,
            notificationType,
            eventType: eventType, // processed, delivered, open, click, bounce, spam, unsubscribe, etc.
            eventData: JSON.stringify({
              sgEventId: sg_event_id,
              sgMessageId: sg_message_id,
              userAgent: useragent,
              ipAddress: ip,
              url: url,
              reason: reason,
              status: status,
            }),
            timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
            userAgent: useragent?.substring(0, 500),
            ipAddress: ip?.substring(0, 50),
          },
        });

        // Handle unsubscribe events
        if (eventType === "unsubscribe" || eventType === "group_unsubscribe") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailUnsubscribed: true,
            },
          });
        }
      } catch (error) {
        console.error("Error processing SendGrid event:", error);
        // Continue processing other events
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing SendGrid webhook:", error);
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 500 }
    );
  }
}

/**
 * SendGrid webhook verification (GET request)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "SendGrid webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}



























