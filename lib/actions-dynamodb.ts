"use server";

import {
  findRoomByRoomId,
  updateRoom,
  createRoom,
  generateUniqueRoomId,
  type Room,
} from "./dynamodb";

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

    if (!input.role || !["girlfriend", "boyfriend"].includes(input.role)) {
      return {
        success: false,
        error: "Valid role is required (girlfriend or boyfriend)",
      };
    }

    // Generar room ID único
    const roomId = await generateUniqueRoomId();

    // Crear el room en DynamoDB
    const roomData: Omit<Room, "created_at" | "updated_at" | "ttl"> = {
      room_id: roomId,
      girlfriend_name: input.role === "girlfriend" ? input.name : undefined,
      boyfriend_name: input.role === "boyfriend" ? input.name : undefined,
      girlfriend_emoji: input.role === "girlfriend" ? input.emoji : undefined,
      boyfriend_emoji: input.role === "boyfriend" ? input.emoji : undefined,
      girlfriend_ready: false,
      boyfriend_ready: false,
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

    // Buscar el room existente
    const existingRoom = await findRoomByRoomId(input.roomId);

    if (!existingRoom) {
      return {
        success: false,
        error:
          "Room not found or has expired. Please check the Room ID and try again.",
      };
    }

    // Determinar qué rol está disponible
    const isGirlfriendMissing = !existingRoom.girlfriend_name;
    const isBoyfriendMissing = !existingRoom.boyfriend_name;

    if (!isGirlfriendMissing && !isBoyfriendMissing) {
      return {
        success: false,
        error: "This room is already full. Both partners have joined.",
      };
    }

    // Asignar el rol disponible
    const assignedRole = isGirlfriendMissing ? "girlfriend" : "boyfriend";

    // Preparar las actualizaciones
    const updates: Partial<Room> = {};
    if (assignedRole === "girlfriend") {
      updates.girlfriend_name = input.name;
      updates.girlfriend_emoji = input.emoji;
    } else {
      updates.boyfriend_name = input.name;
      updates.boyfriend_emoji = input.emoji;
    }

    // Actualizar el room
    await updateRoom(input.roomId, updates);

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

// Función para actualizar las URLs de imágenes
export async function updateRoomImages(
  roomId: string,
  userRole: "girlfriend" | "boyfriend",
  uploadedUrls: { [categoryId: string]: string | string[] }
): Promise<boolean> {
  try {
    const updates: Partial<Room> = {};

    // Mapear las URLs a los campos correspondientes
    Object.entries(uploadedUrls).forEach(([categoryId, urls]) => {
      const fieldName = `${categoryId}_${userRole}` as keyof Room;

      // Si es un array (como character), convertir a JSON string
      if (Array.isArray(urls)) {
        updates[fieldName] = JSON.stringify(urls) as any;
      } else {
        updates[fieldName] = urls as any;
      }
    });

    await updateRoom(roomId, updates);
    return true;
  } catch (error) {
    console.error("Error updating room images:", error);
    return false;
  }
}

// Función para marcar un usuario como ready
export async function markUserReady(
  roomId: string,
  userRole: "girlfriend" | "boyfriend"
): Promise<boolean> {
  try {
    const updates: Partial<Room> = {};

    if (userRole === "girlfriend") {
      updates.girlfriend_ready = true;
    } else {
      updates.boyfriend_ready = true;
    }

    await updateRoom(roomId, updates);
    return true;
  } catch (error) {
    console.error("Error marking user ready:", error);
    return false;
  }
}

// Funciones de compatibilidad con la API existente
export async function createRoomAndRedirect(formData: FormData) {
  const role = formData.get("role") as "girlfriend" | "boyfriend";
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;

  const result = await createRoomDynamoDB({ role, name, emoji });

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
}

export async function joinRoomAndRedirect(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;

  const result = await joinRoomDynamoDB({ roomId, name, emoji });

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
    return await getRoomDataDynamoDB(roomId);
  } catch (error) {
    console.error("Error getting room data:", error);
    return null;
  }
}

// Función para setear datos activos del room (mantener compatibilidad)
export async function setActiveRoomData(
  roomId: string,
  role: "girlfriend" | "boyfriend",
  name: string,
  emoji: string
) {
  return {
    room_id: roomId,
    role,
    name,
    emoji,
    created_at: new Date().toISOString(),
  };
}
