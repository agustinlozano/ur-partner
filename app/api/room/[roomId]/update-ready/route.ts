import { NextRequest } from "next/server";
import { findRoomByRoomId, updateRoom, type Room } from "@/lib/dynamodb";
import { type DatabaseSlot } from "@/lib/role-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { userSlot, isReady } = body;

    if (!roomId || !userSlot || typeof isReady !== "boolean") {
      return Response.json(
        { error: "Room ID, user slot, and ready state are required" },
        { status: 400 }
      );
    }

    // Verify the room exists
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate user slot
    const validSlots: DatabaseSlot[] = ["a", "b"];
    if (!validSlots.includes(userSlot as DatabaseSlot)) {
      return Response.json(
        { error: `Invalid user slot: ${userSlot}` },
        { status: 400 }
      );
    }

    // Determine which field to update based on user role using new schema
    const readyField = `${userSlot}_ready`;

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
      message: `Updated ready state for slot ${userSlot}`,
      roomId,
      userSlot,
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
