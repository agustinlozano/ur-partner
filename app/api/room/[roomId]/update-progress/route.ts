import { NextRequest } from "next/server";
import { findRoomByRoomId, updateRoom, type Room } from "@/lib/dynamodb";
import {
  PERSONALITY_CATEGORIES,
  type PersonalityCategory,
  type DatabaseSlot,
} from "@/lib/role-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { category, hasData, userSlot } = body;

    if (!roomId || !category || !userSlot) {
      return Response.json(
        { error: "Room ID, category, and user slot are required" },
        { status: 400 }
      );
    }

    // Verify the room exists
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate category and userSlot combination using constants
    const validSlots: DatabaseSlot[] = ["a", "b"];

    if (!PERSONALITY_CATEGORIES.includes(category as PersonalityCategory)) {
      return Response.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    if (!validSlots.includes(userSlot as DatabaseSlot)) {
      return Response.json(
        { error: `Invalid user slot: ${userSlot}` },
        { status: 400 }
      );
    }

    // Create the field name for the specific category + role combination using new schema
    const fieldName = `${category}_${userSlot}` as keyof Room;

    // Create the progress indicator value
    const progressValue = hasData ? new Date().toISOString() : "";

    // Prepare the update
    const updates: Partial<Room> = {
      [fieldName]: progressValue,
    };

    // Update the room in DynamoDB
    const updatedRoom = await updateRoom(roomId, updates);

    if (!updatedRoom) {
      return Response.json(
        { error: "Failed to update room progress" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Updated ${category} progress for slot ${userSlot}`,
      roomId,
      category,
      hasData,
      userSlot,
      fieldName,
      progressValue,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return Response.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
