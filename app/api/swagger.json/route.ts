import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger";

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec);
  } catch (error: any) {
    console.error("Error generating Swagger spec:", error);
    return NextResponse.json(
      { error: "Failed to generate Swagger spec", message: error.message },
      { status: 500 }
    );
  }
}

