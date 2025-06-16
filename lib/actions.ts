"use server";

import { findRoomByRoomId, updateSheetRow } from "./sheets";

export interface CreateRoomInput {
  role: "girlfriend" | "boyfriend";
  name: string;
  emoji: string;
}

export interface CreateRoomResult {
  success: boolean;
  room_id?: string;
  error?: string;
}

export interface JoinRoomInput {
  roomId: string;
  name: string;
  emoji: string;
}

export interface JoinRoomResult {
  success: boolean;
  room_id?: string;
  role?: "girlfriend" | "boyfriend";
  error?: string;
}

export async function joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
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

    if (!input.roomId.trim()) {
      return {
        success: false,
        error: "Room ID is required",
      };
    }

    if (!input.emoji.trim()) {
      return {
        success: false,
        error: "Emoji is required",
      };
    }

    // Find the existing room
    const existingRoom = await findRoomByRoomId(input.roomId);

    if (!existingRoom) {
      return {
        success: false,
        error:
          "Room not found or has expired. Please check the Room ID and try again.",
      };
    }

    // Determine which role is missing
    const isGirlfriendMissing = !existingRoom.girlfriend_name;
    const isBoyfriendMissing = !existingRoom.boyfriend_name;

    if (!isGirlfriendMissing && !isBoyfriendMissing) {
      return {
        success: false,
        error: "This room is already full. Both partners have joined.",
      };
    }

    // Determine the role to assign
    const assignedRole = isGirlfriendMissing ? "girlfriend" : "boyfriend";

    // Find the row index in the sheet to update
    const allData = await import("./sheets").then((m) =>
      m.readSheetData(spreadsheetId, "A:AA")
    );

    if (!allData || allData.length <= 1) {
      return {
        success: false,
        error: "Unable to update room data.",
      };
    }

    // Find the row index (1-based, accounting for header row)
    let rowIndex = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === input.roomId) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        error: "Room data not found.",
      };
    }

    // Prepare updated row data (updated with separate role columns)
    const now = new Date().toISOString();
    const updatedRowData = [
      existingRoom.room_id,
      assignedRole === "girlfriend" ? input.name : existingRoom.girlfriend_name,
      assignedRole === "boyfriend" ? input.name : existingRoom.boyfriend_name,
      assignedRole === "girlfriend"
        ? input.emoji
        : existingRoom.girlfriend_emoji,
      assignedRole === "boyfriend" ? input.emoji : existingRoom.boyfriend_emoji,
      existingRoom.animal_girlfriend || "",
      existingRoom.animal_boyfriend || "",
      existingRoom.place_girlfriend || "",
      existingRoom.place_boyfriend || "",
      existingRoom.plant_girlfriend || "",
      existingRoom.plant_boyfriend || "",
      existingRoom.character_girlfriend || "",
      existingRoom.character_boyfriend || "",
      existingRoom.season_girlfriend || "",
      existingRoom.season_boyfriend || "",
      existingRoom.hobby_girlfriend || "",
      existingRoom.hobby_boyfriend || "",
      existingRoom.food_girlfriend || "",
      existingRoom.food_boyfriend || "",
      existingRoom.colour_girlfriend || "",
      existingRoom.colour_boyfriend || "",
      existingRoom.drink_girlfriend || "",
      existingRoom.drink_boyfriend || "",
      existingRoom.girlfriend_ready,
      existingRoom.boyfriend_ready,
      existingRoom.created_at,
      now, // updated_at
    ];

    // Update the specific row
    await updateSheetRow(spreadsheetId, `A${rowIndex}:AA${rowIndex}`, [
      updatedRowData,
    ]);

    return {
      success: true,
      room_id: input.roomId,
      role: assignedRole,
    };
  } catch (error) {
    console.error("Error joining room:", error);
    return {
      success: false,
      error: "Failed to join room. Please try again.",
    };
  }
}

// New function to save active room data to localStorage via client-side
export async function setActiveRoomData(
  roomId: string,
  role: "girlfriend" | "boyfriend",
  name: string,
  emoji: string
) {
  // This will be handled client-side, but we need the structure
  return {
    room_id: roomId,
    role,
    name,
    emoji,
    created_at: new Date().toISOString(),
  };
}

export async function createRoomAndRedirect(formData: FormData) {
  const role = formData.get("role") as "girlfriend" | "boyfriend";
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;

  try {
    // Call the new API route
    const response = await fetch(`${process.env.BASE_URL}/api/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, name, emoji }),
    });

    const result = await response.json();

    if (result.success && result.room_id) {
      const encodedName = encodeURIComponent(name);
      const encodedEmoji = encodeURIComponent(emoji);
      return {
        success: true,
        redirectUrl: `/room/${result.room_id}?new=true&role=${role}&name=${encodedName}&emoji=${encodedEmoji}`,
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to create room",
      };
    }
  } catch (error) {
    console.error("Error calling create room API:", error);
    return {
      success: false,
      error: "Failed to create room. Please try again.",
    };
  }
}

export async function joinRoomAndRedirect(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;

  const result = await joinRoom({ roomId, name, emoji });

  if (result.success && result.room_id && result.role) {
    return {
      success: true,
      redirectUrl: `/room/${result.room_id}?new=true&role=${
        result.role
      }&name=${encodeURIComponent(name)}&emoji=${encodeURIComponent(emoji)}`,
    };
  } else {
    return {
      success: false,
      error: result.error || "Failed to join room",
    };
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
