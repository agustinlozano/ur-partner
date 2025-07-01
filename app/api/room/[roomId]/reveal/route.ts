import { NextRequest } from "next/server";
// import { findRoomByRoomId } from "@/lib/sheets";
import { findRoomByRoomId } from "@/lib/dynamodb";
import {
  slotToRole,
  type LogicalRole,
  type DatabaseSlot,
} from "@/lib/role-utils";

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
    const validSlots: DatabaseSlot[] = ["a", "b"];
    if (!validSlots.includes(userSlot as DatabaseSlot)) {
      return Response.json(
        { error: `Invalid user slot: ${userSlot}` },
        { status: 400 }
      );
    }

    // Get room data to verify both users are ready
    const roomData = await findRoomByRoomId(roomId);
    if (!roomData) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if both users are ready using new schema
    const aReady = roomData.a_ready === true;
    const bReady = roomData.b_ready === true;

    if (!aReady || !bReady) {
      return Response.json(
        { error: "Both users must be ready before revealing" },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: "Both users are ready. Proceeding to reveal...",
      roomId,
      userSlot,
      aReady,
      bReady,
    });
  } catch (error) {
    console.error("Error in reveal process:", error);
    return Response.json(
      { error: "Failed to start reveal process" },
      { status: 500 }
    );
  }
}
