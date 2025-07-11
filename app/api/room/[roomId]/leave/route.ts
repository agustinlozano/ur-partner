import { NextRequest } from "next/server";
import { leaveRoomDynamoDB } from "@/lib/actions-dynamodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { userSlot } = body;

    if (!roomId || !userSlot) {
      return Response.json(
        { error: "Room ID and user slot are required" },
        { status: 400 }
      );
    }

    // Validate user slot
    if (!["a", "b"].includes(userSlot)) {
      return Response.json(
        { error: "Invalid user slot. Must be 'a' or 'b'" },
        { status: 400 }
      );
    }

    // Leave the room using DynamoDB
    const result = await leaveRoomDynamoDB({
      roomId,
      userSlot,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error || "Failed to leave room" },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: `Successfully left room ${roomId}`,
      roomId,
      userSlot,
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    return Response.json({ error: "Failed to leave room" }, { status: 500 });
  }
}
