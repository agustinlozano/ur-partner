import { NextRequest } from "next/server";
import { readSheetData, updateSheetRow } from "@/lib/sheets";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();

    const { userRole, isReady } = body;

    if (!roomId || !userRole || typeof isReady !== "boolean") {
      return Response.json(
        { error: "Room ID, user role, and ready state are required" },
        { status: 400 }
      );
    }

    // Get spreadsheet ID from environment
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("SPREADSHEET_ID not configured");
    }

    // Read current sheet data to find the room row
    const data = await readSheetData(spreadsheetId, "A:AA"); // Extended range

    if (!data || data.length <= 1) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Find the room row index
    let roomRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roomId) {
        roomRowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (roomRowIndex === -1) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Determine which column to update based on user role
    // girlfriend_ready = Column X (index 23), boyfriend_ready = Column Y (index 24)
    const readyColumnIndex = userRole === "girlfriend" ? 23 : 24;
    const columnLetter = String.fromCharCode(65 + readyColumnIndex); // A=65, B=66, etc.
    const range = `${columnLetter}${roomRowIndex}`;

    // Update the ready state
    await updateSheetRow(spreadsheetId, range, [[isReady.toString()]]);

    return Response.json({
      success: true,
      message: `Updated ready state for ${userRole}`,
      roomId,
      userRole,
      isReady,
      range,
    });
  } catch (error) {
    console.error("Error updating ready state:", error);
    return Response.json(
      { error: "Failed to update ready state" },
      { status: 500 }
    );
  }
}
