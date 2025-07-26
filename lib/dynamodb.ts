import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  PERSONALITY_CATEGORIES,
  type DatabaseSlot,
  type AnyRole,
} from "./role-utils";

// Configuración del cliente DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamoDb = DynamoDBDocumentClient.from(client);

// Nombres de las tablas
export const TABLES = {
  ROOMS:
    process.env.AWS_DYNAMODB_TABLE_NAME ||
    process.env.DYNAMODB_ROOMS_TABLE ||
    "Rooms",
} as const;

export interface Room {
  room_id: string; // Partition Key

  // NEW SCHEMA - Neutral role fields
  a_name?: string;
  b_name?: string;
  a_emoji?: string;
  b_emoji?: string;
  a_role?: AnyRole; // Store the relationship role for slot A
  b_role?: AnyRole; // Store the relationship role for slot B

  animal_a?: string;
  animal_b?: string;
  place_a?: string;
  place_b?: string;
  plant_a?: string;
  plant_b?: string;
  character_a?: string; // JSON string para arrays
  character_b?: string;
  season_a?: string;
  season_b?: string;
  hobby_a?: string;
  hobby_b?: string;
  food_a?: string;
  food_b?: string;
  colour_a?: string;
  colour_b?: string;
  drink_a?: string;
  drink_b?: string;

  a_ready?: boolean;
  b_ready?: boolean;
  created_at: string;
  updated_at: string;

  // Realtime fields
  realtime_a_ready?: boolean;
  realtime_b_ready?: boolean;
  realtime_a_progress?: number;
  realtime_b_progress?: number;
  realtime_a_fixed_category?: string;
  realtime_b_fixed_category?: string;
  realtime_a_completed_categories?: string[];
  realtime_b_completed_categories?: string[];
  realtime_chat_messages?: string[];
  realtime_in_room_a?: boolean;
  realtime_in_room_b?: boolean;

  ttl?: number;
}

// Utils
export const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const isRoomExpired = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffInHours > 2.5;
};

// Function to create TTL (3 hours from now)
export const createTTL = (): number => {
  return Math.floor(Date.now() / 1000) + 3 * 60 * 60;
};

// CRUD operations
export const createRoom = async (
  room: Omit<Room, "created_at" | "updated_at" | "ttl">
): Promise<Room> => {
  const now = new Date().toISOString();
  const roomWithTimestamps: Room = {
    ...room,
    created_at: now,
    updated_at: now,
    ttl: createTTL(),
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLES.ROOMS,
      Item: roomWithTimestamps,
    })
  );

  return roomWithTimestamps;
};

// This is DEF. used in many places.
export const findRoomByRoomId = async (
  roomId: string
): Promise<Room | null> => {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLES.ROOMS,
        Key: { room_id: roomId },
      })
    );

    if (!result.Item) {
      return null;
    }

    const room = result.Item as Room;

    // Check if the room has expired
    if (room.created_at && isRoomExpired(room.created_at)) {
      return null;
    }

    return room;
  } catch (error) {
    console.error("Error finding room:", error);
    throw new Error("Failed to find room");
  }
};

// TODO: check if this is still used
export const updateRoom = async (
  roomId: string,
  updates: Partial<Omit<Room, "room_id" | "created_at">>
): Promise<Room | null> => {
  try {
    const now = new Date().toISOString();

    // Build the update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add updated_at automatically
    updateExpressions.push("#updated_at = :updated_at");
    expressionAttributeNames["#updated_at"] = "updated_at";
    expressionAttributeValues[":updated_at"] = now;

    // Process each update field
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;

        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
      }
    });

    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLES.ROOMS,
        Key: { room_id: roomId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return (result.Attributes as Room) || null;
  } catch (error) {
    console.error("Error updating room:", error);
    throw new Error("Failed to update room");
  }
};

// TODO: check if this is still used
// Function to check if a room ID already exists
export const roomExists = async (roomId: string): Promise<boolean> => {
  try {
    const room = await findRoomByRoomId(roomId);
    return room !== null;
  } catch (error) {
    return false;
  }
};

// Function to generate a unique room ID
export const generateUniqueRoomId = async (
  maxAttempts: number = 10
): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    const roomId = generateRoomId();
    const exists = await roomExists(roomId);
    if (!exists) {
      return roomId;
    }
  }
  throw new Error("Unable to generate unique room ID");
};

// Function to remove a user from a room by slot (clear their data)
export const leaveRoomBySlot = async (
  roomId: string,
  userSlot: DatabaseSlot
): Promise<Room | null> => {
  try {
    const updates: Partial<Room> = {};

    // Clear basic fields using direct template strings
    const nameField = `${userSlot}_name` as keyof Room;
    const emojiField = `${userSlot}_emoji` as keyof Room;
    const roleField = `${userSlot}_role` as keyof Room;
    const readyField = `${userSlot}_ready` as keyof Room;

    updates[nameField] = "" as any;
    updates[emojiField] = "" as any;
    updates[roleField] = "" as any;
    updates[readyField] = false as any;

    // Clear all image category fields using direct template strings
    PERSONALITY_CATEGORIES.forEach((category) => {
      const fieldName = `${category}_${userSlot}` as keyof Room;
      updates[fieldName] = "" as any;
    });

    const updatedRoom = await updateRoom(roomId, updates);
    return updatedRoom;
  } catch (error) {
    console.error("Error leaving room by slot:", error);
    throw new Error("Failed to leave room");
  }
};

// Function to get all rooms (for development purposes)
export const getAllRooms = async (): Promise<Room[]> => {
  try {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLES.ROOMS,
      })
    );

    const rooms = (result.Items as Room[]) || [];

    // Filter out expired rooms
    const activeRooms = rooms.filter((room) => {
      if (!room.created_at) return false;
      return !isRoomExpired(room.created_at);
    });

    // Sort by created_at (newest first)
    return activeRooms.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error getting all rooms:", error);
    throw new Error("Failed to get all rooms");
  }
};

// Function to get all rooms including expired ones (for development purposes)
export const getAllRoomsIncludingExpired = async (): Promise<Room[]> => {
  try {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLES.ROOMS,
      })
    );

    const rooms = (result.Items as Room[]) || [];

    // Sort by created_at (newest first) - no filtering
    return rooms.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error getting all rooms including expired:", error);
    throw new Error("Failed to get all rooms including expired");
  }
};
