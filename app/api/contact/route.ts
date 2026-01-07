import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  subjectRegarding: z.string().min(1, "Subject regarding is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = contactSchema.parse(body);

    // In production, you would:
    // 1. Send an email to the admin/contact email
    // 2. Store the message in a database
    // 3. Send an auto-reply to the user
    
    // For now, just log it
    console.log("Contact form submission:", validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Contact form error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0].message || "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing your message. Please try again.",
      },
      { status: 500 }
    );
  }
}





















