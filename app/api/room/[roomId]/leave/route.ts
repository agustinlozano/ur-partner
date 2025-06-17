import { NextRequest } from "next/server";
import { leaveRoomDynamoDB } from "@/lib/actions-dynamodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { userRole } = body;

    if (!roomId || !userRole) {
      return Response.json(
        { error: "Room ID and user role are required" },
        { status: 400 }
      );
    }

    // Validate user role
    if (!["girlfriend", "boyfriend"].includes(userRole)) {
      return Response.json(
        { error: "Invalid user role. Must be 'girlfriend' or 'boyfriend'" },
        { status: 400 }
      );
    }

    // Leave the room using DynamoDB
    const result = await leaveRoomDynamoDB({
      roomId,
      userRole,
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
      userRole,
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    return Response.json({ error: "Failed to leave room" }, { status: 500 });
  }
}
