"use server";

import { appendToSheet, generateRoomId, findRoomByRoomId } from "./sheets";
import { redirect } from "next/navigation";

export interface CreateRoomInput {
  role: "girlfriend" | "boyfriend";
  name: string;
}

export interface CreateRoomResult {
  success: boolean;
  room_id?: string;
  error?: string;
}

export async function createRoom(
  input: CreateRoomInput
): Promise<CreateRoomResult> {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;

    if (!spreadsheetId) {
      return {
        success: false,
        error: "Server configuration error: SPREADSHEET_ID not set",
      };
    }

    if (!input.name.trim()) {
      return {
        success: false,
        error: "Name is required",
      };
    }

    // Generate unique room ID
    let roomId = generateRoomId();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure room ID is unique (check against existing rooms)
    while (attempts < maxAttempts) {
      const existingRoom = await findRoomByRoomId(roomId);
      if (!existingRoom) {
        break; // Room ID is unique
      }
      roomId = generateRoomId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: "Unable to generate unique room ID. Please try again.",
      };
    }

    // Prepare the row data
    const now = new Date().toISOString();
    const rowData = [
      roomId, // room_id
      input.role === "girlfriend" ? input.name : "", // girlfriend_name
      input.role === "boyfriend" ? input.name : "", // boyfriend_name
      "", // animal
      "", // place
      "", // plant
      "", // character
      "", // season
      "", // hobby
      "", // food
      "", // colour
      "", // drink
      "", // girlfriend_ready
      "", // boyfriend_ready
      now, // created_at
      now, // updated_at
    ];

    // Add to Google Sheet
    await appendToSheet(spreadsheetId, "A:P", [rowData]);

    return {
      success: true,
      room_id: roomId,
    };
  } catch (error) {
    console.error("Error creating room:", error);
    return {
      success: false,
      error: "Failed to create room. Please try again.",
    };
  }
}

export async function createRoomAndRedirect(formData: FormData) {
  const role = formData.get("role") as "girlfriend" | "boyfriend";
  const name = formData.get("name") as string;

  const result = await createRoom({ role, name });

  if (result.success && result.room_id) {
    redirect(`/room/${result.room_id}`);
  } else {
    throw new Error(result.error || "Failed to create room");
  }
}

export async function getRoomData(roomId: string) {
  try {
    return await findRoomByRoomId(roomId);
  } catch (error) {
    console.error("Error getting room data:", error);
    return null;
  }
}
