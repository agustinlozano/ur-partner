import { NextRequest } from "next/server";
import { findRoomByRoomId } from "@/lib/sheets";

// Helper function to check if a string is a date
function isDateString(str: string): boolean {
  // Check for ISO date format (2025-06-14T04:38:59.398Z or similar)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (isoDateRegex.test(str)) {
    return true;
  }

  // Check if it's a valid date when parsed
  const date = new Date(str);
  return !isNaN(date.getTime()) && str.length > 10; // Avoid short strings that might accidentally parse as dates
}

// Helper function to validate if a string is a valid image URL
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Must be a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Must start with http/https
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }

  // Should not be a date string
  if (isDateString(url)) {
    return false;
  }

  return true;
}

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
        // Skip if it's a date string (ISO format or similar)
        if (isDateString(imageData.trim())) {
          continue;
        }

        try {
          // Try to parse as JSON (for character category with multiple images)
          const parsed = JSON.parse(imageData);
          if (Array.isArray(parsed)) {
            // Validate that all items in array are valid image URLs
            const validUrls = parsed.filter((url) => isValidImageUrl(url));
            if (validUrls.length > 0) {
              partnerImages[category] = validUrls;
              totalImagesFound += validUrls.length;
            }
          } else if (isValidImageUrl(parsed)) {
            partnerImages[category] = parsed;
            totalImagesFound += 1;
          }
        } catch {
          // If not JSON, treat as single URL and validate
          if (isValidImageUrl(imageData.trim())) {
            partnerImages[category] = imageData.trim();
            totalImagesFound += 1;
          }
        }
      }
    }

    const isReady = Object.keys(partnerImages).length >= 9; // At least 8 of 9 categories

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
