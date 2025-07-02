import { NextRequest } from "next/server";
import { findRoomByRoomId } from "@/lib/dynamodb";
import { PERSONALITY_CATEGORIES, type DatabaseSlot } from "@/lib/role-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return Response.json({ error: "Room ID required" }, { status: 400 });
    }

    // Get current user slot from request headers or query params
    const url = new URL(request.url);
    const currentUserSlot = url.searchParams.get("slot") || "a";

    // Validate user slot
    const validSlots: DatabaseSlot[] = ["a", "b"];
    if (!validSlots.includes(currentUserSlot as DatabaseSlot)) {
      return Response.json(
        { error: `Invalid user slot: ${currentUserSlot}` },
        { status: 400 }
      );
    }

    // Get room data from DynamoDB
    const roomData = await findRoomByRoomId(roomId);

    if (!roomData) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const partnerSlot = currentUserSlot === "a" ? "b" : "a";

    // Check which categories the partner has completed
    const partnerCompletedCategories: string[] = [];

    // Map DynamoDB columns to category IDs based on partner role using new schema
    const categoryMapping: Record<string, string | undefined> = {};

    PERSONALITY_CATEGORIES.forEach((category) => {
      const fieldName = `${category}_${partnerSlot}` as keyof typeof roomData;
      categoryMapping[category] = roomData[fieldName] as string | undefined;
    });

    // Check which categories have data for the partner
    Object.entries(categoryMapping).forEach(([categoryId, value]) => {
      if (value && value.trim() !== "") {
        // Since we now have separate columns, any non-empty value means completion
        partnerCompletedCategories.push(categoryId);
      }
    });

    // Check if partner is ready using new schema
    const partnerReadyField = `ready_${partnerSlot}` as keyof typeof roomData;
    const partnerReady = roomData[partnerReadyField] === true;

    const progress = {
      completed: partnerCompletedCategories,
      total: 9,
      isReady: partnerReady,
    };

    return Response.json({
      success: true,
      progress,
      roomId,
      currentUserSlot,
    });
  } catch (error) {
    console.error("Error fetching partner status:", error);
    return Response.json(
      { error: "Failed to fetch partner status" },
      { status: 500 }
    );
  }
}
