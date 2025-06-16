import { NextRequest } from "next/server";
import { findRoomByRoomId, updateRoom, type Room } from "@/lib/dynamodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { category, hasData, userRole } = body;

    if (!roomId || !category || !userRole) {
      return Response.json(
        { error: "Room ID, category, and user role are required" },
        { status: 400 }
      );
    }

    // Verify the room exists
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate category and userRole combination
    const validCategories = [
      "animal",
      "place",
      "plant",
      "character",
      "season",
      "hobby",
      "food",
      "colour",
      "drink",
    ];
    const validRoles = ["girlfriend", "boyfriend"];

    if (!validCategories.includes(category)) {
      return Response.json(
        { error: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    if (!validRoles.includes(userRole)) {
      return Response.json(
        { error: `Invalid user role: ${userRole}` },
        { status: 400 }
      );
    }

    // Create the field name for the specific category + role combination
    const fieldName = `${category}_${userRole}` as keyof Room;

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
      message: `Updated ${category} progress for ${userRole}`,
      roomId,
      category,
      hasData,
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
