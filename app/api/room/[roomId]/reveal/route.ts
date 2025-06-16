import { NextRequest } from "next/server";
// import { findRoomByRoomId } from "@/lib/sheets";
import { findRoomByRoomId } from "@/lib/dynamodb";

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

    // Get room data to verify both users are ready
    const roomData = await findRoomByRoomId(roomId);
    if (!roomData) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if both users are ready
    const girlfriendReady = roomData.girlfriend_ready === true;
    const boyfriendReady = roomData.boyfriend_ready === true;

    if (!girlfriendReady || !boyfriendReady) {
      return Response.json(
        { error: "Both users must be ready before revealing" },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: "Both users are ready. Proceeding to reveal...",
      roomId,
      userRole,
      girlfriendReady,
      boyfriendReady,
    });
  } catch (error) {
    console.error("Error in reveal process:", error);
    return Response.json(
      { error: "Failed to start reveal process" },
      { status: 500 }
    );
  }
}
