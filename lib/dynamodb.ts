import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { LogicRole, ImageCategory } from "./types";

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

/**
 * Room interface supporting both legacy and new dual-role format
 *
 * LEGACY FORMAT (backward compatibility):
 * - girlfriend_* / boyfriend_* fields
 *
 * NEW FORMAT (inclusive roles):
 * - partner_a_* / partner_b_* fields
 *
 * FIELD MAPPING:
 * - girlfriend_* ↔ partner_a_*
 * - boyfriend_* ↔ partner_b_*
 */
export interface Room {
  // ============================================================================
  // CORE ROOM DATA
  // ============================================================================

  /** Partition Key - Unique room identifier */
  room_id: string;

  /** ISO timestamp when room was created */
  created_at: string;

  /** ISO timestamp when room was last updated */
  updated_at: string;

  /** Unix timestamp for automatic deletion (3 hours) */
  ttl?: number;

  /** Room format version for migration tracking */
  format_version?: "legacy" | "dual_role";

  /** ISO timestamp when room was migrated to new format */
  migration_date?: string;

  // ============================================================================
  // LEGACY FIELDS (Backward Compatibility)
  // ============================================================================

  /** Legacy: Name of the girlfriend */
  girlfriend_name?: string;

  /** Legacy: Name of the boyfriend */
  boyfriend_name?: string;

  /** Legacy: Girlfriend's selected avatar emoji */
  girlfriend_emoji?: string;

  /** Legacy: Boyfriend's selected avatar emoji */
  boyfriend_emoji?: string;

  /** Legacy: Whether girlfriend has submitted all images */
  girlfriend_ready?: boolean;

  /** Legacy: Whether boyfriend has submitted all images */
  boyfriend_ready?: boolean;

  // ============================================================================
  // NEW INCLUSIVE ROLE FIELDS
  // ============================================================================

  /** New: Partner A name (maps to girlfriend_name for compatibility) */
  partner_a_name?: string;

  /** New: Partner B name (maps to boyfriend_name for compatibility) */
  partner_b_name?: string;

  /** New: Partner A display role label (e.g., "Girlfriend", "Partner", "Wife") */
  partner_a_display_role?: string;

  /** New: Partner B display role label (e.g., "Boyfriend", "Partner", "Husband") */
  partner_b_display_role?: string;

  /** New: Partner A display emoji */
  partner_a_display_emoji?: string;

  /** New: Partner B display emoji */
  partner_b_display_emoji?: string;

  /** New: Partner A pronouns (e.g., "she/her", "they/them") */
  partner_a_pronouns?: string;

  /** New: Partner B pronouns (e.g., "he/him", "they/them") */
  partner_b_pronouns?: string;

  /** New: Whether partner A has submitted all images */
  partner_a_ready?: boolean;

  /** New: Whether partner B has submitted all images */
  partner_b_ready?: boolean;

  // ============================================================================
  // LEGACY IMAGE FIELDS (Backward Compatibility)
  // ============================================================================

  animal_girlfriend?: string;
  animal_boyfriend?: string;
  place_girlfriend?: string;
  place_boyfriend?: string;
  plant_girlfriend?: string;
  plant_boyfriend?: string;
  character_girlfriend?: string; // JSON string for arrays
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

  // ============================================================================
  // NEW PARTNER-BASED IMAGE FIELDS
  // ============================================================================

  animal_partner_a?: string;
  animal_partner_b?: string;
  place_partner_a?: string;
  place_partner_b?: string;
  plant_partner_a?: string;
  plant_partner_b?: string;
  character_partner_a?: string; // JSON string for arrays
  character_partner_b?: string;
  season_partner_a?: string;
  season_partner_b?: string;
  hobby_partner_a?: string;
  hobby_partner_b?: string;
  food_partner_a?: string;
  food_partner_b?: string;
  colour_partner_a?: string;
  colour_partner_b?: string;
  drink_partner_a?: string;
  drink_partner_b?: string;
}

// ============================================================================
// UTILITY TYPES & CONSTANTS
// ============================================================================

/**
 * Legacy role types for backward compatibility
 */
export type LegacyRole = "girlfriend" | "boyfriend";

/**
 * Field mapping between legacy and new formats
 */
export const FIELD_MAPPING = {
  // Name fields
  girlfriend_name: "partner_a_name",
  boyfriend_name: "partner_b_name",

  // Emoji fields (legacy → new)
  girlfriend_emoji: "partner_a_display_emoji",
  boyfriend_emoji: "partner_b_display_emoji",

  // Ready status
  girlfriend_ready: "partner_a_ready",
  boyfriend_ready: "partner_b_ready",
} as const;

/**
 * Reverse field mapping (new → legacy)
 */
export const REVERSE_FIELD_MAPPING = {
  partner_a_name: "girlfriend_name",
  partner_b_name: "boyfriend_name",
  partner_a_display_emoji: "girlfriend_emoji",
  partner_b_display_emoji: "boyfriend_emoji",
  partner_a_ready: "girlfriend_ready",
  partner_b_ready: "boyfriend_ready",
} as const;

/**
 * Logic role to legacy role mapping
 */
export const LOGIC_TO_LEGACY_ROLE: Record<LogicRole, LegacyRole> = {
  partner_a: "girlfriend",
  partner_b: "boyfriend",
};

/**
 * Legacy role to logic role mapping
 */
export const LEGACY_TO_LOGIC_ROLE: Record<LegacyRole, LogicRole> = {
  girlfriend: "partner_a",
  boyfriend: "partner_b",
};

/**
 * Image categories for field mapping
 */
export const IMAGE_CATEGORIES: ImageCategory[] = [
  "animal",
  "place",
  "plant",
  "character",
  "season",
  "hobby",
  "food",
  "colour",
  "drink",
];

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

/**
 * Helper function to get field name for image category
 * Supports both legacy and new formats
 */
export const getImageFieldName = (
  category: ImageCategory,
  role: LegacyRole | LogicRole,
  format: "legacy" | "new" = "legacy"
): keyof Room => {
  if (format === "new") {
    // Convert legacy role to logic role if needed
    const logicRole = role as LogicRole;
    return `${category}_${logicRole}` as keyof Room;
  } else {
    // Use legacy format
    const legacyRole = role as LegacyRole;
    return `${category}_${legacyRole}` as keyof Room;
  }
};

/**
 * Function to update the image URLs
 * Supports both legacy and new format updating
 */
export const updateRoomImages = async (
  roomId: string,
  userRole: LegacyRole | LogicRole,
  uploadedUrls: { [categoryId: string]: string | string[] },
  options?: {
    /** Whether to update both legacy and new formats */
    dualFormat?: boolean;
    /** Preferred format for new data */
    preferredFormat?: "legacy" | "new";
  }
): Promise<boolean> => {
  try {
    const updates: Partial<Room> = {};
    const { dualFormat = true, preferredFormat = "legacy" } = options || {};

    // Map the URLs to the corresponding fields
    Object.entries(uploadedUrls).forEach(([categoryId, urls]) => {
      const category = categoryId as ImageCategory;

      // Convert URLs to string format for storage
      const urlValue = Array.isArray(urls) ? JSON.stringify(urls) : urls;

      if (dualFormat) {
        // Update both legacy and new formats for maximum compatibility

        // Legacy format
        const legacyRole =
          userRole === "partner_a" || userRole === "partner_b"
            ? LOGIC_TO_LEGACY_ROLE[userRole as LogicRole]
            : (userRole as LegacyRole);
        const legacyFieldName = getImageFieldName(
          category,
          legacyRole,
          "legacy"
        );
        updates[legacyFieldName] = urlValue as any;

        // New format
        const logicRole =
          userRole === "girlfriend" || userRole === "boyfriend"
            ? LEGACY_TO_LOGIC_ROLE[userRole as LegacyRole]
            : (userRole as LogicRole);
        const newFieldName = getImageFieldName(category, logicRole, "new");
        updates[newFieldName] = urlValue as any;
      } else {
        // Update only preferred format
        if (preferredFormat === "new") {
          const logicRole =
            userRole === "girlfriend" || userRole === "boyfriend"
              ? LEGACY_TO_LOGIC_ROLE[userRole as LegacyRole]
              : (userRole as LogicRole);
          const fieldName = getImageFieldName(category, logicRole, "new");
          updates[fieldName] = urlValue as any;
        } else {
          const legacyRole =
            userRole === "partner_a" || userRole === "partner_b"
              ? LOGIC_TO_LEGACY_ROLE[userRole as LogicRole]
              : (userRole as LegacyRole);
          const fieldName = getImageFieldName(category, legacyRole, "legacy");
          updates[fieldName] = urlValue as any;
        }
      }
    });

    await updateRoom(roomId, updates);
    return true;
  } catch (error) {
    console.error("Error updating room images:", error);
    return false;
  }
};

/**
 * Function to remove a user from a room (clear their data)
 * Supports both legacy and new role formats
 */
export const leaveRoom = async (
  roomId: string,
  userRole: LegacyRole | LogicRole
): Promise<Room | null> => {
  try {
    const updates: Partial<Room> = {};

    // Determine both legacy and logic roles for comprehensive cleanup
    let legacyRole: LegacyRole;
    let logicRole: LogicRole;

    if (userRole === "girlfriend" || userRole === "boyfriend") {
      // Input is legacy role
      legacyRole = userRole as LegacyRole;
      logicRole = LEGACY_TO_LOGIC_ROLE[legacyRole];
    } else {
      // Input is logic role
      logicRole = userRole as LogicRole;
      legacyRole = LOGIC_TO_LEGACY_ROLE[logicRole];
    }

    // Clear legacy format fields
    if (legacyRole === "girlfriend") {
      updates.girlfriend_name = undefined;
      updates.girlfriend_emoji = undefined;
      updates.girlfriend_ready = false;
    } else {
      updates.boyfriend_name = undefined;
      updates.boyfriend_emoji = undefined;
      updates.boyfriend_ready = false;
    }

    // Clear new format fields
    if (logicRole === "partner_a") {
      updates.partner_a_name = undefined;
      updates.partner_a_display_role = undefined;
      updates.partner_a_display_emoji = undefined;
      updates.partner_a_pronouns = undefined;
      updates.partner_a_ready = false;
    } else {
      updates.partner_b_name = undefined;
      updates.partner_b_display_role = undefined;
      updates.partner_b_display_emoji = undefined;
      updates.partner_b_pronouns = undefined;
      updates.partner_b_ready = false;
    }

    // Clear all image categories for both formats
    IMAGE_CATEGORIES.forEach((category) => {
      // Clear legacy format image fields
      const legacyFieldName = getImageFieldName(category, legacyRole, "legacy");
      updates[legacyFieldName] = undefined as any;

      // Clear new format image fields
      const newFieldName = getImageFieldName(category, logicRole, "new");
      updates[newFieldName] = undefined as any;
    });

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
