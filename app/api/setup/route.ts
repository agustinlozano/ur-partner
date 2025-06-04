import { setupSheetHeaders } from "@/lib/setup-sheet";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await setupSheetHeaders();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Setup error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
