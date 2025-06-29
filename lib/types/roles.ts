/**
 * 🏳️‍🌈 Dual Roles System - TypeScript Interfaces
 *
 * Defines the type system for inclusive role management that separates
 * logical roles (partner_a/partner_b) from display roles (girlfriend/boyfriend/partner/etc.)
 */

// ============================================================================
// CORE ROLE TYPES
// ============================================================================

/**
 * Logic roles used internally for data organization and compatibility
 * These never change and maintain backward compatibility
 */
export type LogicRole = "partner_a" | "partner_b";

/**
 * Display role configuration for user-facing presentation
 */
export interface DisplayRole {
  /** User-visible role label (e.g., "Girlfriend", "Partner", "Wife") */
  label: string;

  /** Associated emoji for visual representation */
  emoji: string;

  /** Optional pronouns (e.g., "she/her", "he/him", "they/them") */
  pronouns?: string;
}

/**
 * Complete user role combining logical and display aspects
 */
export interface UserRole {
  /** Internal logical role for data organization */
  logicRole: LogicRole;

  /** User-facing display configuration */
  displayRole: DisplayRole;
}

// ============================================================================
// ROLE PRESETS & CONFIGURATION
// ============================================================================

/**
 * Predefined role preset for easy selection
 */
export interface RolePreset {
  /** Unique identifier for this preset */
  key: string;

  /** Display label for the preset */
  label: string;

  /** Associated emoji */
  emoji: string;

  /** Optional pronouns */
  pronouns?: string;

  /** Which logical role this preset maps to */
  logicRole: LogicRole;

  /** Category this preset belongs to */
  category: "traditional" | "inclusive" | "custom";
}

/**
 * Configuration for custom role creation
 */
export interface CustomRoleConfig {
  /** Whether custom roles are allowed */
  allowCustom: boolean;

  /** Maximum length for custom role labels */
  maxLabelLength: number;

  /** Available emojis for selection */
  availableEmojis: string[];

  /** Available pronouns for selection */
  availablePronouns: string[];
}

/**
 * Validation result for role data
 */
export interface RoleValidation {
  /** Whether the role data is valid */
  isValid: boolean;

  /** Validation error messages */
  errors: string[];

  /** Warning messages (non-blocking) */
  warnings?: string[];
}

// ============================================================================
// ROOM DATA INTERFACES
// ============================================================================

/**
 * Legacy room format (backward compatibility)
 */
export interface LegacyRoomFormat {
  room_id: string;
  girlfriend_name?: string;
  boyfriend_name?: string;
  girlfriend_emoji?: string;
  boyfriend_emoji?: string;
  girlfriend_ready?: boolean;
  boyfriend_ready?: boolean;
  created_at: string;
  updated_at: string;
  ttl?: number;

  // Image fields (legacy format)
  animal_girlfriend?: string;
  animal_boyfriend?: string;
  place_girlfriend?: string;
  place_boyfriend?: string;
  plant_girlfriend?: string;
  plant_boyfriend?: string;
  character_girlfriend?: string;
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
}

/**
 * New room format with inclusive role support
 */
export interface NewRoomFormat extends LegacyRoomFormat {
  // New partner-based fields
  partner_a_name?: string;
  partner_b_name?: string;
  partner_a_display_role?: string;
  partner_b_display_role?: string;
  partner_a_display_emoji?: string;
  partner_b_display_emoji?: string;
  partner_a_pronouns?: string;
  partner_b_pronouns?: string;
  partner_a_ready?: boolean;
  partner_b_ready?: boolean;

  // New image fields (partner-based)
  animal_partner_a?: string;
  animal_partner_b?: string;
  place_partner_a?: string;
  place_partner_b?: string;
  plant_partner_a?: string;
  plant_partner_b?: string;
  character_partner_a?: string;
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

/**
 * Complete room interface supporting both formats
 */
export interface Room extends NewRoomFormat {
  // Additional metadata
  format_version?: "legacy" | "dual_role";
  migration_date?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Image category IDs
 */
export type ImageCategory =
  | "animal"
  | "place"
  | "plant"
  | "character"
  | "season"
  | "hobby"
  | "food"
  | "colour"
  | "drink";

/**
 * Role field mapping for image categories
 */
export type RoleImageField<T extends ImageCategory> =
  | `${T}_girlfriend`
  | `${T}_boyfriend`
  | `${T}_partner_a`
  | `${T}_partner_b`;

/**
 * User context for role operations
 */
export interface UserContext {
  /** Current user's name */
  name: string;

  /** Current user's logical role */
  logicRole: LogicRole;

  /** Current user's display role */
  displayRole: DisplayRole;

  /** Room ID */
  roomId: string;
}

/**
 * Role selection state
 */
export interface RoleSelectionState {
  /** Currently selected role */
  selectedRole?: UserRole;

  /** Available role presets */
  availablePresets: RolePreset[];

  /** Roles already taken in the room */
  excludedLogicRoles: LogicRole[];

  /** Whether custom roles are enabled */
  customRolesEnabled: boolean;

  /** Validation state */
  validation: RoleValidation;
}

// ============================================================================
// EVENT & ACTION TYPES
// ============================================================================

/**
 * Role-related events for analytics and monitoring
 */
export interface RoleEvent {
  /** Event type */
  type: "role_selected" | "role_changed" | "custom_role_created";

  /** Event timestamp */
  timestamp: Date;

  /** Role data */
  roleData: UserRole;

  /** Additional context */
  context: {
    roomId: string;
    userAgent?: string;
    source: "create_room" | "join_room" | "role_change";
  };
}

/**
 * Action types for role operations
 */
export type RoleAction =
  | { type: "SET_SELECTED_ROLE"; payload: UserRole }
  | { type: "SET_AVAILABLE_PRESETS"; payload: RolePreset[] }
  | { type: "SET_EXCLUDED_ROLES"; payload: LogicRole[] }
  | { type: "TOGGLE_CUSTOM_ROLES"; payload: boolean }
  | { type: "VALIDATE_ROLE"; payload: UserRole }
  | { type: "RESET_SELECTION" };

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for role selection components
 */
export interface RoleSelectionProps {
  /** Callback when a role is selected */
  onRoleSelect: (role: UserRole) => void;

  /** Logic role to exclude (already taken) */
  excludeLogicRole?: LogicRole;

  /** Whether to show custom role builder */
  allowCustomRoles?: boolean;

  /** Initial selected role */
  initialRole?: UserRole;

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: string;
}

/**
 * Props for role card components
 */
export interface RoleCardProps {
  /** Role preset to display */
  preset: RolePreset;

  /** Whether this role is selected */
  isSelected?: boolean;

  /** Whether this role is disabled */
  isDisabled?: boolean;

  /** Click handler */
  onClick: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for custom role builder
 */
export interface CustomRoleBuilderProps {
  /** Callback when custom role is created */
  onSubmit: (displayRole: DisplayRole) => void;

  /** Configuration for custom roles */
  config: CustomRoleConfig;

  /** Cancel handler */
  onCancel: () => void;

  /** Initial values */
  initialValues?: Partial<DisplayRole>;
}

// ============================================================================
// EXPORTS
// ============================================================================

// All types and interfaces are exported individually above
// No default export needed for type-only module
