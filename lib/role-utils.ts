/**
 * Role Utilities for Database Schema Migration
 * Handles mapping between logical roles and database slots
 */

// Type definitions
export type LogicalRole = "girlfriend" | "boyfriend";
export type DatabaseSlot = "a" | "b";

// New expanded role types for flexible relationships
export type RelationshipRole =
  | "girlfriend"
  | "boyfriend"
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
