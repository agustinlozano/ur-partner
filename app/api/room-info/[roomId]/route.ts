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

    // Check if room is full
    const isGirlfriendMissing = !room.girlfriend_name;
    const isBoyfriendMissing = !room.boyfriend_name;
    const isFull = !isGirlfriendMissing && !isBoyfriendMissing;

    return NextResponse.json({
      success: true,
      room: {
        room_id: room.room_id,
        girlfriend_name: room.girlfriend_name,
        boyfriend_name: room.boyfriend_name,
        girlfriend_emoji: room.girlfriend_emoji,
        boyfriend_emoji: room.boyfriend_emoji,
        created_at: room.created_at,
        is_full: isFull,
        missing_role: isGirlfriendMissing
          ? "girlfriend"
          : isBoyfriendMissing
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
