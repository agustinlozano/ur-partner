import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@vercel/firewall";
import {
  createRoomDynamoDB,
  type CreateRoomInput,
} from "@/lib/actions-dynamodb";

export async function POST(request: NextRequest) {
  const { rateLimited } = await checkRateLimit("update-object", { request });
  if (rateLimited) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
      }
    );
  }

  try {
    const body: CreateRoomInput = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    if (!body.emoji?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Emoji is required",
        },
        { status: 400 }
      );
    }

    if (!body.role || !["girlfriend", "boyfriend"].includes(body.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid role is required (girlfriend or boyfriend)",
        },
        { status: 400 }
      );
    }

    const result = await createRoomDynamoDB(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        room_id: result.room_id,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create room. Please try again.",
      },
      { status: 500 }
    );
  }
}
