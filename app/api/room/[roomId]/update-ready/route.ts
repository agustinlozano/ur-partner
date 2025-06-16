import { NextRequest } from "next/server";
import { findRoomByRoomId, updateRoom, type Room } from "@/lib/dynamodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { userRole, isReady } = body;

    if (!roomId || !userRole || typeof isReady !== "boolean") {
      return Response.json(
        { error: "Room ID, user role, and ready state are required" },
        { status: 400 }
      );
    }

    // Verify the room exists
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate user role
    const validRoles = ["girlfriend", "boyfriend"];
    if (!validRoles.includes(userRole)) {
      return Response.json(
        { error: `Invalid user role: ${userRole}` },
        { status: 400 }
      );
    }

    // Determine which field to update based on user role
    const readyField =
      userRole === "girlfriend" ? "girlfriend_ready" : "boyfriend_ready";

    // Prepare the update
    const updates: Partial<Room> = {
      [readyField]: isReady,
    };

    // Update the room in DynamoDB
    const updatedRoom = await updateRoom(roomId, updates);

    if (!updatedRoom) {
      return Response.json(
        { error: "Failed to update ready state" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Updated ready state for ${userRole}`,
      roomId,
      userRole,
      isReady,
      fieldName: readyField,
    });
  } catch (error) {
    console.error("Error updating ready state:", error);
    return Response.json(
      { error: "Failed to update ready state" },
      { status: 500 }
    );
  }
}
