"use server";

import {
  findRoomByRoomId,
  updateRoom,
  createRoom,
  generateUniqueRoomId,
  type Room,
} from "./dynamodb";
import { type DatabaseSlot, type AnyRole } from "./role-utils";

export interface CreateRoomInput {
  userSlot: DatabaseSlot;
  userRole: AnyRole;
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
  userRole: AnyRole;
  name: string;
  emoji: string;
}

export interface JoinRoomResult {
  success: boolean;
  room_id?: string;
  assignedSlot?: DatabaseSlot;
  error?: string;
}

export async function createRoomDynamoDB(
  input: CreateRoomInput
): Promise<CreateRoomResult> {
  try {
    if (!input.name.trim()) {
      return {
        success: false,
        error: "Name is required",
      };
    }

    if (!input.emoji.trim()) {
      return {
        success: false,
        error: "Emoji is required",
      };
    }

    if (!input.userSlot || !["a", "b"].includes(input.userSlot)) {
      return {
        success: false,
        error: "Valid user slot is required (a or b)",
      };
    }

    if (!input.userRole || !input.userRole.trim()) {
      return {
        success: false,
        error: "User role is required",
      };
    }

    // Generate unique room ID
    const roomId = await generateUniqueRoomId();

    // Create room in DynamoDB using direct templates
    const roomData: Omit<Room, "created_at" | "updated_at" | "ttl"> = {
      room_id: roomId,
      [`${input.userSlot}_name`]: input.name,
      [`${input.userSlot}_emoji`]: input.emoji,
      [`${input.userSlot}_role`]: input.userRole,
      [`${input.userSlot}_ready`]: false,
    };

    await createRoom(roomData);

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

export async function joinRoomDynamoDB(
  input: JoinRoomInput
): Promise<JoinRoomResult> {
  try {
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

    if (!input.userRole || !input.userRole.trim()) {
      return {
        success: false,
        error: "User role is required",
      };
    }

    // Find existing room
    const existingRoom = await findRoomByRoomId(input.roomId);

    if (!existingRoom) {
      return {
        success: false,
        error:
          "Room not found or has expired. Please check the Room ID and try again.",
      };
    }

    // Determine which slot is available
    const isSlotAAvailable = !existingRoom.a_name;
    const isSlotBAvailable = !existingRoom.b_name;

    if (!isSlotAAvailable && !isSlotBAvailable) {
      return {
        success: false,
        error: "This room is already full. Both partners have joined.",
      };
    }

    // Assign the first available slot: should be always "b"
    const assignedSlot: DatabaseSlot = isSlotAAvailable ? "a" : "b";

    // Prepare updates using direct templates
    const updates: Partial<Room> = {
      [`${assignedSlot}_name`]: input.name,
      [`${assignedSlot}_emoji`]: input.emoji,
      [`${assignedSlot}_role`]: input.userRole,
    };

    // Update the room
    await updateRoom(input.roomId, updates);

    return {
      success: true,
      room_id: input.roomId,
      assignedSlot,
    };
  } catch (error) {
    console.error("Error joining room:", error);
    return {
      success: false,
      error: "Failed to join room. Please try again.",
    };
  }
}

export async function getRoomDataDynamoDB(
  roomId: string
): Promise<Room | null> {
  try {
    return await findRoomByRoomId(roomId);
  } catch (error) {
    console.error("Error getting room data:", error);
    return null;
  }
}

export interface LeaveRoomInput {
  roomId: string;
  userSlot: DatabaseSlot;
}

export interface LeaveRoomResult {
  success: boolean;
  error?: string;
}

export async function leaveRoomDynamoDB(
  input: LeaveRoomInput
): Promise<LeaveRoomResult> {
  try {
    if (!input.roomId.trim()) {
      return {
        success: false,
        error: "Room ID is required",
      };
    }

    if (!input.userSlot || !["a", "b"].includes(input.userSlot)) {
      return {
        success: false,
        error: "Valid user slot is required (a or b)",
      };
    }

    // Verify that the room exists
    const existingRoom = await findRoomByRoomId(input.roomId);
    if (!existingRoom) {
      return {
        success: false,
        error: "Room not found or has expired",
      };
    }

    // Verify that the user is in the room using slot
    const userName =
      input.userSlot === "a" ? existingRoom.a_name : existingRoom.b_name;

    if (!userName) {
      return {
        success: false,
        error: "User is not in this room",
      };
    }

    // Use the leaveRoomBySlot function from dynamodb.ts
    const { leaveRoomBySlot } = await import("./dynamodb");
    await leaveRoomBySlot(input.roomId, input.userSlot);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error leaving room:", error);
    return {
      success: false,
      error: "Failed to leave room. Please try again.",
    };
  }
}

// Functions for backward compatibility with existing API
export async function createRoomAndRedirect(formData: FormData) {
  const role = formData.get("role") as "girlfriend" | "boyfriend";
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;

  // The user that creates the room is always in slot A
  const userSlot: DatabaseSlot = "a";

  const result = await createRoomDynamoDB({
    userSlot,
    userRole: role,
    name,
    emoji,
  });

  if (result.success && result.room_id) {
    const encodedName = encodeURIComponent(name);
    const encodedEmoji = encodeURIComponent(emoji);
    return {
      success: true,
      redirectUrl: `/room/${result.room_id}?new=true&role=${role}&slot=${userSlot}&name=${encodedName}&emoji=${encodedEmoji}`,
    };
  } else {
    return {
      success: false,
      error: result.error || "Failed to create room",
    };
  }
}

export async function joinRoomAndRedirect(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;
  const role = formData.get("role") as AnyRole;

  const result = await joinRoomDynamoDB({
    roomId,
    userRole: role,
    name,
    emoji,
  });

  if (result.success && result.room_id && result.assignedSlot) {
    return {
      success: true,
      redirectUrl: `/room/${result.room_id}?new=true&role=${role}&slot=${
        result.assignedSlot
      }&name=${encodeURIComponent(name)}&emoji=${encodeURIComponent(emoji)}`,
    };
  } else {
    return {
      success: false,
      error: result.error || "Failed to join room",
    };
  }
}
