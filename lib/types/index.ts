/**
 * Central types index - exports all type definitions for the application
 */

// ============================================================================
// DUAL ROLES SYSTEM TYPES
// ============================================================================

export type {
  // Core role types
  LogicRole,
  DisplayRole,
  UserRole,

  // Role presets and configuration
  RolePreset,
  CustomRoleConfig,
  RoleValidation,

  // Room data interfaces
  LegacyRoomFormat,
  NewRoomFormat,
  Room,

  // Utility types
  ImageCategory,
  RoleImageField,
  UserContext,
  RoleSelectionState,

  // Event and action types
  RoleEvent,
  RoleAction,

  // Component prop types
  RoleSelectionProps,
  RoleCardProps,
  CustomRoleBuilderProps,
} from "./roles";

// ============================================================================
// FUTURE TYPE EXPORTS
// ============================================================================

// Add other type exports here as the application grows
// export type { ... } from './other-types';
