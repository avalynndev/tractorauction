import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Email tracking endpoint
 * Tracks email opens and clicks for analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user");
    const notificationType = searchParams.get("type");
    const event = searchParams.get("event") || "open";
    const targetUrl = searchParams.get("url"); // For click events
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown";

    if (!userId || !notificationType) {
      // Return 1x1 transparent pixel even if tracking fails
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

        // Record email event
        try {
          const eventData: any = {};
          if (targetUrl) {
            eventData.url = targetUrl;
          }

          await prisma.emailEvent.create({
            data: {
              userId,
              email: user.email,
              notificationType,
              eventType: event,
              eventData: Object.keys(eventData).length > 0 ? JSON.stringify(eventData) : null,
              userAgent: userAgent.substring(0, 500), // Limit length
              ipAddress: ipAddress.substring(0, 50),
            },
          });
        } catch (error) {
          // Don't fail the request if tracking fails
          console.error("Error tracking email event:", error);
        }

    // For click events, redirect to target URL
    if (event === "click" && targetUrl) {
      return NextResponse.redirect(targetUrl, 302);
    }

    // Return 1x1 transparent pixel for open events
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error in email tracking:", error);
    // Always return pixel even on error
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
        },
      }
    );
  }
}

