import { getRoomData } from "@/lib/actions";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      );
    }

    const room = await getRoomData(roomId);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: "Room not found or has expired",
        },
        { status: 404 }
      );
    }

    // Check if room is full using new schema
    const isSlotAMissing = !room.a_name;
    const isSlotBMissing = !room.b_name;
    const isFull = !isSlotAMissing && !isSlotBMissing;

    return NextResponse.json({
      success: true,
      room: {
        room_id: room.room_id,
        a_name: room.a_name,
        b_name: room.b_name,
        a_emoji: room.a_emoji,
        b_emoji: room.b_emoji,
        created_at: room.created_at,
        is_full: isFull,
        missing_role: isSlotAMissing
          ? "girlfriend"
          : isSlotBMissing
          ? "boyfriend"
          : null,
      },
    });
  } catch (error) {
    console.error("Error getting room info:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get room information",
      },
      { status: 500 }
    );
  }
}
