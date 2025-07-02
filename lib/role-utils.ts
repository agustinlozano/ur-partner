/**
 * Role Utilities for Database Schema Migration
 * Handles mapping between logical roles and database slots
 */

// Type definitions
export type LogicalRole = "girlfriend" | "boyfriend";
export type DatabaseSlot = "a" | "b";

// New expanded role types for flexible relationships
export type RelationshipRole =
  | "friend"
  | "roommate"
  | "workmate"
  | "gym bro"
  | "sister"
  | "gym girl";

// Combined type for all possible roles
export type AnyRole = LogicalRole | RelationshipRole;

// Categories used in the personality form
export const PERSONALITY_CATEGORIES = [
  "animal",
  "place",
  "plant",
  "character",
  "season",
  "hobby",
  "food",
  "colour",
  "drink",
] as const;

export type PersonalityCategory = (typeof PERSONALITY_CATEGORIES)[number];

/**
 * Maps logical role to database slot
 * @param role - The logical role (girlfriend | boyfriend)
 * @returns The database slot (a | b)
 */
export function roleToSlot(role: LogicalRole): DatabaseSlot {
  if (role !== "girlfriend" && role !== "boyfriend") {
    throw new Error("Invalid role");
  }
  return role === "girlfriend" ? "a" : "b";
}

/**
 * Maps database slot back to logical role
 * @param slot - The database slot (a | b)
 * @returns The logical role (girlfriend | boyfriend)
 */
export function slotToRole(slot: DatabaseSlot): LogicalRole {
  return slot === "a" ? "girlfriend" : "boyfriend";
}

/**
 * Gets the old field name for a category and role
 * @param category - The personality category
 * @param role - The logical role
 * @returns The old field name (e.g., "animal_girlfriend")
 */
export function getOldFieldName(
  category: PersonalityCategory,
  role: LogicalRole
): string {
  return `${category}_${role}`;
}

/**
 * Gets the new field name for a category and database slot
 * @param category - The personality category
 * @param slot - The database slot
 * @returns The new field name (e.g., "animal_a")
 */
export function getSlotFieldName(
  category: PersonalityCategory,
  slot: DatabaseSlot
): string {
  return `${category}_${slot}`;
}

/**
 * Gets the new field name for a category and logical role
 * @param category - The personality category
 * @param role - The logical role
 * @returns The new field name (e.g., "animal_a" for girlfriend)
 */
export function getFieldName(
  category: PersonalityCategory,
  role: LogicalRole
): string {
  const slot = roleToSlot(role);
  return getSlotFieldName(category, slot);
}

/**
 * Gets the basic field name for a role (name, emoji, ready)
 * @param fieldType - The field type ("name" | "emoji" | "ready")
 * @param role - The logical role
 * @returns The new field name (e.g., "a_name" for girlfriend)
 */
export function getBasicFieldName(
  fieldType: "name" | "emoji" | "ready",
  role: LogicalRole
): string {
  const slot = roleToSlot(role);
  return `${slot}_${fieldType}`;
}

/**
 * Gets the basic field name by slot
 * @param fieldType - The field type ("name" | "emoji" | "ready")
 * @param slot - The database slot
 * @returns The field name (e.g., "a_name")
 */
export function getBasicSlotFieldName(
  fieldType: "name" | "emoji" | "ready",
  slot: DatabaseSlot
): string {
  return `${slot}_${fieldType}`;
}

/**
 * Helper to get all field mappings for migration
 * @returns Object mapping old field names to new field names
 */
export function getAllFieldMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};

  // Basic fields
  mappings.girlfriend_name = "a_name";
  mappings.boyfriend_name = "b_name";
  mappings.girlfriend_emoji = "a_emoji";
  mappings.boyfriend_emoji = "b_emoji";
  mappings.girlfriend_ready = "a_ready";
  mappings.boyfriend_ready = "b_ready";

  // Category fields
  PERSONALITY_CATEGORIES.forEach((category) => {
    mappings[getOldFieldName(category, "girlfriend")] = getFieldName(
      category,
      "girlfriend"
    );
    mappings[getOldFieldName(category, "boyfriend")] = getFieldName(
      category,
      "boyfriend"
    );
  });

  return mappings;
}

/**
 * Helper to check if user is in slot A
 * @param role - The logical role
 * @returns True if user is in slot A (girlfriend)
 */
export function isSlotA(role: LogicalRole): boolean {
  return role === "girlfriend";
}

/**
 * Helper to check if user is in slot B
 * @param role - The logical role
 * @returns True if user is in slot B (boyfriend)
 */
export function isSlotB(role: LogicalRole): boolean {
  return role === "boyfriend";
}

/**
 * Get the opposite role
 * @param role - The current role
 * @returns The opposite role
 */
export function getOppositeRole(role: LogicalRole): LogicalRole {
  return role === "girlfriend" ? "boyfriend" : "girlfriend";
}

/**
 * Get the opposite slot
 * @param slot - The current slot
 * @returns The opposite slot
 */
export function getOppositeSlot(slot: DatabaseSlot): DatabaseSlot {
  if (slot !== "a" && slot !== "b") {
    throw new Error("Invalid slot");
  }
  return slot === "a" ? "b" : "a";
}

/**
 * Convert role-based updates to slot-based updates
 * @param updates - Updates using logical roles
 * @returns Updates using database slots
 */
export function convertRoleUpdatesToSlotUpdates<T extends Record<string, any>>(
  updates: T
): Record<string, any> {
  const slotUpdates: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    // Handle basic fields (girlfriend_name, boyfriend_ready, etc.)
    if (key.endsWith("_girlfriend") || key.endsWith("_boyfriend")) {
      const role = key.endsWith("_girlfriend") ? "girlfriend" : "boyfriend";
      const fieldType = key.replace(`_${role}`, "");
      const slot = roleToSlot(role);
      const newKey = `${slot}_${fieldType}`;
      slotUpdates[newKey] = value;
    }
    // Handle category fields (animal_girlfriend, place_boyfriend, etc.)
    else if (key.includes("_girlfriend") || key.includes("_boyfriend")) {
      if (key.includes("_girlfriend")) {
        const category = key.replace("_girlfriend", "");
        const newKey = `${category}_a`;
        slotUpdates[newKey] = value;
      } else if (key.includes("_boyfriend")) {
        const category = key.replace("_boyfriend", "");
        const newKey = `${category}_b`;
        slotUpdates[newKey] = value;
      }
    }
    // Keep non-role fields as-is
    else {
      slotUpdates[key] = value;
    }
  });

  return slotUpdates;
}

/**
 * Convert slot-based data back to role-based data for display
 * @param data - Data using database slots
 * @returns Data using logical roles for UI display
 */
export function convertSlotDataToRoleData(
  data: Record<string, any>
): Record<string, any> {
  const roleData: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    // Handle basic fields (a_name, b_ready, etc.)
    if (key.startsWith("a_") || key.startsWith("b_")) {
      const slot = key.startsWith("a_") ? "a" : "b";
      const fieldType = key.replace(`${slot}_`, "");
      const role = slotToRole(slot as DatabaseSlot);
      const newKey = `${role}_${fieldType}`;
      roleData[newKey] = value;
    }
    // Handle category fields (animal_a, place_b, etc.)
    else if (key.endsWith("_a") || key.endsWith("_b")) {
      const slot = key.endsWith("_a") ? "a" : "b";
      const category = key.replace(`_${slot}`, "");
      const role = slotToRole(slot as DatabaseSlot);
      const newKey = `${category}_${role}`;
      roleData[newKey] = value;
    }
    // Keep non-slot fields as-is
    else {
      roleData[key] = value;
    }
  });

  return roleData;
}

/**
 * Get field name by role for any field type
 * @param fieldName - Base field name (without role suffix)
 * @param role - The logical role
 * @returns The complete field name
 */
export function getFieldNameForRole(
  fieldName: string,
  role: LogicalRole
): string {
  const slot = roleToSlot(role);

  // Check if it's a basic field (name, emoji, ready)
  if (["name", "emoji", "ready"].includes(fieldName)) {
    return `${slot}_${fieldName}`;
  }

  // Otherwise it's a category field
  return `${fieldName}_${slot}`;
}

/**
 * Get all possible field names for a given base field
 * @param fieldName - Base field name
 * @returns Array of both role variants [girlfriend_version, boyfriend_version]
 */
export function getAllRoleVariants(fieldName: string): string[] {
  return [
    getFieldNameForRole(fieldName, "girlfriend"),
    getFieldNameForRole(fieldName, "boyfriend"),
  ];
}
