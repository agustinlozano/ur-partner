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
    const partnerCompletedCategories: string[] = [];

    // Map sheet columns to category IDs based on partner role
    const categoryMapping = {
      animal:
        partnerRole === "girlfriend"
          ? roomData.animal_girlfriend
          : roomData.animal_boyfriend,
      place:
        partnerRole === "girlfriend"
          ? roomData.place_girlfriend
          : roomData.place_boyfriend,
      plant:
        partnerRole === "girlfriend"
          ? roomData.plant_girlfriend
          : roomData.plant_boyfriend,
      character:
        partnerRole === "girlfriend"
          ? roomData.character_girlfriend
          : roomData.character_boyfriend,
      season:
        partnerRole === "girlfriend"
          ? roomData.season_girlfriend
          : roomData.season_boyfriend,
      hobby:
        partnerRole === "girlfriend"
          ? roomData.hobby_girlfriend
          : roomData.hobby_boyfriend,
      food:
        partnerRole === "girlfriend"
          ? roomData.food_girlfriend
          : roomData.food_boyfriend,
      colour:
        partnerRole === "girlfriend"
          ? roomData.colour_girlfriend
          : roomData.colour_boyfriend,
      drink:
        partnerRole === "girlfriend"
          ? roomData.drink_girlfriend
          : roomData.drink_boyfriend,
    };

    // Check which categories have data for the partner
    Object.entries(categoryMapping).forEach(([categoryId, value]) => {
      if (value && value.trim() !== "") {
        // Since we now have separate columns, any non-empty value means completion
        partnerCompletedCategories.push(categoryId);
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
