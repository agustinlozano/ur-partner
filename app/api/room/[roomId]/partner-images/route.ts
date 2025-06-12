import { NextRequest } from "next/server";
import { findRoomByRoomId } from "@/lib/sheets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get("userRole");

    if (!roomId || !userRole) {
      return Response.json(
        { error: "Room ID and user role are required" },
        { status: 400 }
      );
    }

    // Determine partner role
    const partnerRole = userRole === "girlfriend" ? "boyfriend" : "girlfriend";

    // Find room data to get the stored image URLs
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Extract partner's image URLs from the room data
    const categories = [
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

    const partnerImages: { [key: string]: string | string[] } = {};
    let totalImagesFound = 0;

    for (const category of categories) {
      const columnKey = `${category}_${partnerRole}`;
      const imageData = room[columnKey as keyof typeof room];

      if (imageData && imageData.trim()) {
        try {
          // Try to parse as JSON (for character category with multiple images)
          const parsed = JSON.parse(imageData);
          if (Array.isArray(parsed)) {
            partnerImages[category] = parsed;
            totalImagesFound += parsed.length;
          } else {
            partnerImages[category] = parsed;
            totalImagesFound += 1;
          }
        } catch {
          // If not JSON, treat as single URL
          partnerImages[category] = imageData;
          totalImagesFound += 1;
        }
      }
    }

    const isReady = Object.keys(partnerImages).length >= 8; // At least 8 of 9 categories

    return Response.json({
      success: true,
      isReady,
      partnerRole,
      images: partnerImages,
      totalImages: totalImagesFound,
      categoriesCompleted: Object.keys(partnerImages).length,
      message: isReady
        ? "Partner images are ready for reveal!"
        : "Partner is still uploading images...",
    });
  } catch (error) {
    console.error("Error fetching partner images:", error);
    return Response.json(
      { error: "Failed to fetch partner images" },
      { status: 500 }
    );
  }
}
