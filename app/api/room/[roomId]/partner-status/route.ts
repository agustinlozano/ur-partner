import { NextRequest } from "next/server";
import { findRoomByRoomId } from "@/lib/sheets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return Response.json({ error: "Room ID required" }, { status: 400 });
    }

    // Get current user from request headers or query params
    const url = new URL(request.url);
    const currentUserRole = url.searchParams.get("role") || "girlfriend"; // Default fallback

    // Get room data from sheets
    const roomData = await findRoomByRoomId(roomId);

    if (!roomData) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Determine partner role and info
    const partnerRole =
      currentUserRole === "girlfriend" ? "boyfriend" : "girlfriend";
    const partnerName =
      partnerRole === "girlfriend"
        ? roomData.girlfriend_name
        : roomData.boyfriend_name;

    // Check which categories the partner has completed
    // For now, we'll simulate this - in real implementation, this would come from the sheets
    const partnerCompletedCategories: string[] = [];

    // Map sheet columns to category IDs
    const categoryMapping = {
      animal: roomData.animal,
      place: roomData.place,
      plant: roomData.plant,
      character: roomData.character,
      season: roomData.season,
      hobby: roomData.hobby,
      food: roomData.food,
      colour: roomData.colour,
      drink: roomData.drink,
    };

    // Check which categories have data for the partner
    Object.entries(categoryMapping).forEach(([categoryId, value]) => {
      if (value && value.trim() !== "") {
        // Check if the value contains the partner's role (format: "role:timestamp")
        if (value.includes(`${partnerRole}:`)) {
          partnerCompletedCategories.push(categoryId);
        }
      }
    });

    // Check if partner is ready
    const partnerReady =
      partnerRole === "girlfriend"
        ? roomData.girlfriend_ready === "true" ||
          roomData.girlfriend_ready === true
        : roomData.boyfriend_ready === "true" ||
          roomData.boyfriend_ready === true;

    const progress = {
      completed: partnerCompletedCategories,
      total: 9,
      isReady: partnerReady,
      name: partnerName,
    };

    return Response.json({
      success: true,
      progress,
      roomId,
      partnerRole,
    });
  } catch (error) {
    console.error("Error fetching partner status:", error);
    return Response.json(
      { error: "Failed to fetch partner status" },
      { status: 500 }
    );
  }
}
