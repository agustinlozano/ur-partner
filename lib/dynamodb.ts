import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

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
  ROOMS: process.env.DYNAMODB_ROOMS_TABLE || "Rooms",
} as const;

export interface Room {
  room_id: string; // Partition Key
  girlfriend_name?: string;
  boyfriend_name?: string;
  girlfriend_emoji?: string;
  boyfriend_emoji?: string;

  animal_girlfriend?: string;
  animal_boyfriend?: string;
  place_girlfriend?: string;
  place_boyfriend?: string;
  plant_girlfriend?: string;
  plant_boyfriend?: string;
  character_girlfriend?: string; // JSON string para arrays
  character_boyfriend?: string;
  season_girlfriend?: string;
  season_boyfriend?: string;
  hobby_girlfriend?: string;
  hobby_boyfriend?: string;
  food_girlfriend?: string;
  food_boyfriend?: string;
  colour_girlfriend?: string;
  colour_boyfriend?: string;
  drink_girlfriend?: string;
  drink_boyfriend?: string;

  girlfriend_ready?: boolean;
  boyfriend_ready?: boolean;
  created_at: string;
  updated_at: string;

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

// Function to update the image URLs
export const updateRoomImages = async (
  roomId: string,
  userRole: "girlfriend" | "boyfriend",
  uploadedUrls: { [categoryId: string]: string | string[] }
): Promise<boolean> => {
  try {
    const updates: Partial<Room> = {};

    // Map the URLs to the corresponding fields
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
};

// Function to remove a user from a room (clear their data)
export const leaveRoom = async (
  roomId: string,
  userRole: "girlfriend" | "boyfriend"
): Promise<Room | null> => {
  try {
    const updates: Partial<Room> = {};

    if (userRole === "girlfriend") {
      // Clear girlfriend data
      updates.girlfriend_name = "";
      updates.girlfriend_emoji = "";
      updates.girlfriend_ready = false;

      // Clear all girlfriend image categories
      updates.animal_girlfriend = "";
      updates.place_girlfriend = "";
      updates.plant_girlfriend = "";
      updates.character_girlfriend = "";
      updates.season_girlfriend = "";
      updates.hobby_girlfriend = "";
      updates.food_girlfriend = "";
      updates.colour_girlfriend = "";
      updates.drink_girlfriend = "";
    } else {
      // Clear boyfriend data
      updates.boyfriend_name = "";
      updates.boyfriend_emoji = "";
      updates.boyfriend_ready = false;

      // Clear all boyfriend image categories
      updates.animal_boyfriend = "";
      updates.place_boyfriend = "";
      updates.plant_boyfriend = "";
      updates.character_boyfriend = "";
      updates.season_boyfriend = "";
      updates.hobby_boyfriend = "";
      updates.food_boyfriend = "";
      updates.colour_boyfriend = "";
      updates.drink_boyfriend = "";
    }

    const updatedRoom = await updateRoom(roomId, updates);
    return updatedRoom;
  } catch (error) {
    console.error("Error leaving room:", error);
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
