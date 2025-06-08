import { NextRequest } from "next/server";
import { findRoomByRoomId, updateSheetRow, readSheetData } from "@/lib/sheets";

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

    // Get spreadsheet ID from environment
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("SPREADSHEET_ID not configured");
    }

    // Read current sheet data to find the room row
    const data = await readSheetData(spreadsheetId, "A:R");

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

    // Map category to column index (based on sheets.ts structure)
    const categoryColumnMap: { [key: string]: number } = {
      animal: 5, // Column F (index 5)
      place: 6, // Column G (index 6)
      plant: 7, // Column H (index 7)
      character: 8, // Column I (index 8)
      season: 9, // Column J (index 9)
      hobby: 10, // Column K (index 10)
      food: 11, // Column L (index 11)
      colour: 12, // Column M (index 12)
      drink: 13, // Column N (index 13)
    };

    const columnIndex = categoryColumnMap[category];
    if (columnIndex === undefined) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    // Create the progress indicator value
    // We'll store the user role and timestamp to track who completed what
    const progressValue = hasData
      ? `${userRole}:${new Date().toISOString()}`
      : "";

    // Convert column index to letter notation
    const columnLetter = String.fromCharCode(65 + columnIndex); // A=65, B=66, etc.
    const range = `${columnLetter}${roomRowIndex}`;

    // Update the specific cell
    await updateSheetRow(spreadsheetId, range, [[progressValue]]);

    return Response.json({
      success: true,
      message: `Updated ${category} progress for ${userRole}`,
      roomId,
      category,
      hasData,
      range,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return Response.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
