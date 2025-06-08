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

    // Map category + role to column index (based on new structure)
    const categoryColumnMap: { [key: string]: number } = {
      // girlfriend columns (starting at index 5)
      animal_girlfriend: 5,
      place_girlfriend: 7,
      plant_girlfriend: 9,
      character_girlfriend: 11,
      season_girlfriend: 13,
      hobby_girlfriend: 15,
      food_girlfriend: 17,
      colour_girlfriend: 19,
      drink_girlfriend: 21,
      // boyfriend columns
      animal_boyfriend: 6,
      place_boyfriend: 8,
      plant_boyfriend: 10,
      character_boyfriend: 12,
      season_boyfriend: 14,
      hobby_boyfriend: 16,
      food_boyfriend: 18,
      colour_boyfriend: 20,
      drink_boyfriend: 22,
    };

    // Create the key for the specific category + role combination
    const columnKey = `${category}_${userRole}`;
    const columnIndex = categoryColumnMap[columnKey];

    if (columnIndex === undefined) {
      return Response.json(
        {
          error: `Invalid category-role combination: ${columnKey}`,
        },
        { status: 400 }
      );
    }

    // Create the progress indicator value
    // Since we now have separate columns per role, we just need the timestamp
    const progressValue = hasData ? new Date().toISOString() : "";

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
