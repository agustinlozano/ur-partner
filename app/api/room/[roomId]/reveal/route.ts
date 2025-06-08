import { NextRequest } from "next/server";
import { findRoomByRoomId, updateSheetRow, readSheetData } from "@/lib/sheets";
import { put } from "@vercel/blob";

interface ImageData {
  [categoryId: string]: string | string[]; // base64 images from localStorage
}

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
    const girlfriendReady =
      roomData.girlfriend_ready === "true" ||
      roomData.girlfriend_ready === true;
    const boyfriendReady =
      roomData.boyfriend_ready === "true" || roomData.boyfriend_ready === true;

    if (!girlfriendReady || !boyfriendReady) {
      return Response.json(
        { error: "Both users must be ready before revealing" },
        { status: 400 }
      );
    }

    // For now, we'll just return success and let the client handle the redirect
    // The actual image upload will happen when users visit the reveal page
    // This allows us to show a loading state while processing

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

// Helper function to upload images to Vercel Blob (will be used later)
async function uploadImageToBlob(
  base64Image: string,
  filename: string
): Promise<string> {
  try {
    // Convert base64 to buffer
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Vercel Blob
    const { url } = await put(filename, buffer, {
      access: "public",
    });

    return url;
  } catch (error) {
    console.error("Error uploading to blob:", error);
    throw error;
  }
}
