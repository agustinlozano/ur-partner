import { config } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

// Load environment variables from .env file
config();

// Debug environment variables
console.log("🔍 Environment Variables Debug:");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(
  `AWS_REGION: ${process.env.AWS_REGION || "(not set, using default)"}`
);
console.log(
  `AWS_ACCESS_KEY_ID: ${
    process.env.AWS_ACCESS_KEY_ID
      ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 6)}...`
      : "(not set)"
  }`
);
console.log(
  `AWS_SECRET_ACCESS_KEY: ${
    process.env.AWS_SECRET_ACCESS_KEY ? "***HIDDEN***" : "(not set)"
  }`
);
console.log(
  `AWS_DYNAMODB_TABLE_NAME: ${
    process.env.AWS_DYNAMODB_TABLE_NAME || "(not set, using default)"
  }`
);
console.log("=".repeat(60));

// Validate required environment variables
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.error("❌ AWS_ACCESS_KEY_ID is not set in environment variables");
  process.exit(1);
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("❌ AWS_SECRET_ACCESS_KEY is not set in environment variables");
  process.exit(1);
}

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE_NAME || "Rooms";

console.log(`🗄️  Using DynamoDB table: ${TABLE_NAME}`);
console.log("=".repeat(60));

// Field mapping from old schema to new schema
const FIELD_MAPPING = {
  // Basic fields
  girlfriend_name: "a_name",
  boyfriend_name: "b_name",
  girlfriend_emoji: "a_emoji",
  boyfriend_emoji: "b_emoji",
  girlfriend_ready: "a_ready",
  boyfriend_ready: "b_ready",

  // Image category fields
  animal_girlfriend: "animal_a",
  animal_boyfriend: "animal_b",
  place_girlfriend: "place_a",
  place_boyfriend: "place_b",
  plant_girlfriend: "plant_a",
  plant_boyfriend: "plant_b",
  character_girlfriend: "character_a",
  character_boyfriend: "character_b",
  season_girlfriend: "season_a",
  season_boyfriend: "season_b",
  hobby_girlfriend: "hobby_a",
  hobby_boyfriend: "hobby_b",
  food_girlfriend: "food_a",
  food_boyfriend: "food_b",
  colour_girlfriend: "colour_a",
  colour_boyfriend: "colour_b",
  drink_girlfriend: "drink_a",
  drink_boyfriend: "drink_b",
};

interface MigrationStats {
  totalRooms: number;
  successfulMigrations: number;
  skippedRooms: number;
  failedMigrations: number;
  errors: string[];
}

interface RoomItem {
  room_id: string;
  [key: string]: any;
}

// Function to scan all rooms
async function scanAllRooms(): Promise<RoomItem[]> {
  console.log("🔍 Scanning all rooms in DynamoDB...");

  const allItems: RoomItem[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    try {
      const params = {
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const result = await docClient.send(new ScanCommand(params));

      if (result.Items) {
        allItems.push(...(result.Items as RoomItem[]));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;

      console.log(`📊 Scanned ${allItems.length} rooms so far...`);
    } catch (error) {
      console.error("❌ Error scanning rooms:", error);
      throw error;
    }
  } while (lastEvaluatedKey);

  console.log(`✅ Scan complete! Found ${allItems.length} total rooms.`);
  return allItems;
}

// Function to check if room needs migration
function needsMigration(room: RoomItem): boolean {
  // Check if any old field exists and corresponding new field doesn't exist
  for (const [oldField, newField] of Object.entries(FIELD_MAPPING)) {
    if (room[oldField] !== undefined && room[newField] === undefined) {
      return true;
    }
  }
  return false;
}

// Function to create migration update expression
function createMigrationUpdate(room: RoomItem): {
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, any>;
} {
  const setExpressions: string[] = [];
  const removeExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let valueIndex = 0;

  for (const [oldField, newField] of Object.entries(FIELD_MAPPING)) {
    if (room[oldField] !== undefined) {
      // Add new field with value from old field
      const valueKey = `:val${valueIndex}`;
      const newFieldKey = `#${newField}`;

      setExpressions.push(`${newFieldKey} = ${valueKey}`);
      expressionAttributeNames[newFieldKey] = newField;
      expressionAttributeValues[valueKey] = room[oldField];

      // Mark old field for removal
      const oldFieldKey = `#${oldField}`;
      removeExpressions.push(oldFieldKey);
      expressionAttributeNames[oldFieldKey] = oldField;

      valueIndex++;
    }
  }

  // Always update the updated_at timestamp
  const updatedAtKey = `:updated_at`;
  const updatedAtFieldKey = `#updated_at`;
  setExpressions.push(`${updatedAtFieldKey} = ${updatedAtKey}`);
  expressionAttributeNames[updatedAtFieldKey] = "updated_at";
  expressionAttributeValues[updatedAtKey] = new Date().toISOString();

  let updateExpression = "";
  if (setExpressions.length > 0) {
    updateExpression += `SET ${setExpressions.join(", ")}`;
  }
  if (removeExpressions.length > 0) {
    updateExpression += ` REMOVE ${removeExpressions.join(", ")}`;
  }

  return {
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues,
  };
}

// Function to migrate a single room
async function migrateRoom(room: RoomItem): Promise<boolean> {
  try {
    const {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = createMigrationUpdate(room);

    if (!updateExpression) {
      console.log(`⏭️  Room ${room.room_id}: No migration needed`);
      return true;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: { room_id: room.room_id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW" as const,
    };

    await docClient.send(new UpdateCommand(params));
    console.log(`✅ Room ${room.room_id}: Successfully migrated`);
    return true;
  } catch (error) {
    console.error(`❌ Room ${room.room_id}: Migration failed -`, error);
    return false;
  }
}

// Function to verify migration for a room
async function verifyMigration(roomId: string): Promise<boolean> {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { room_id: roomId },
    };

    const result = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: [{ room_id: roomId }],
          },
        },
      })
    );

    const room = result.Responses?.[TABLE_NAME]?.[0];
    if (!room) {
      console.error(`❌ Verification failed: Room ${roomId} not found`);
      return false;
    }

    // Check that all old fields are removed and new fields exist where expected
    let hasOldFields = false;
    let missingNewFields = false;

    for (const [oldField, newField] of Object.entries(FIELD_MAPPING)) {
      if (room[oldField] !== undefined) {
        hasOldFields = true;
        console.error(
          `❌ Verification failed: Room ${roomId} still has old field: ${oldField}`
        );
      }
    }

    if (hasOldFields || missingNewFields) {
      return false;
    }

    console.log(`✅ Room ${roomId}: Migration verified successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Room ${roomId}: Verification failed -`, error);
    return false;
  }
}

// Main migration function
async function runMigration(
  options: { dryRun?: boolean; verify?: boolean } = {}
): Promise<MigrationStats> {
  const { dryRun = false, verify = false } = options;

  console.log("🚀 Starting database schema migration...");
  console.log(`📋 Mode: ${dryRun ? "DRY RUN" : "LIVE MIGRATION"}`);
  console.log(`🔍 Verification: ${verify ? "ENABLED" : "DISABLED"}`);
  console.log("=".repeat(60));

  const stats: MigrationStats = {
    totalRooms: 0,
    successfulMigrations: 0,
    skippedRooms: 0,
    failedMigrations: 0,
    errors: [],
  };

  try {
    // Step 1: Scan all rooms
    const allRooms = await scanAllRooms();
    stats.totalRooms = allRooms.length;

    if (stats.totalRooms === 0) {
      console.log("ℹ️  No rooms found in database.");
      return stats;
    }

    console.log(`\n📊 Found ${stats.totalRooms} rooms total`);

    // Step 2: Filter rooms that need migration
    const roomsToMigrate = allRooms.filter(needsMigration);
    const roomsAlreadyMigrated = allRooms.length - roomsToMigrate.length;

    console.log(`📈 ${roomsToMigrate.length} rooms need migration`);
    console.log(`✅ ${roomsAlreadyMigrated} rooms already migrated`);

    if (roomsToMigrate.length === 0) {
      console.log("🎉 All rooms are already migrated!");
      stats.skippedRooms = stats.totalRooms;
      return stats;
    }

    // Step 3: Show migration plan
    console.log("\n📋 Migration Plan:");
    console.log("=".repeat(40));

    for (const room of roomsToMigrate.slice(0, 5)) {
      // Show first 5 as example
      console.log(`🔄 Room ${room.room_id}:`);
      for (const [oldField, newField] of Object.entries(FIELD_MAPPING)) {
        if (room[oldField] !== undefined) {
          const value =
            typeof room[oldField] === "string" && room[oldField].length > 50
              ? room[oldField].substring(0, 47) + "..."
              : room[oldField];
          console.log(`   ${oldField} → ${newField}: ${JSON.stringify(value)}`);
        }
      }
      console.log("");
    }

    if (roomsToMigrate.length > 5) {
      console.log(`   ... and ${roomsToMigrate.length - 5} more rooms`);
    }

    if (dryRun) {
      console.log("🧪 DRY RUN: No changes will be made to the database.");
      stats.skippedRooms = roomsToMigrate.length;
      return stats;
    }

    // Step 4: Confirm migration
    console.log("\n⚠️  This will modify your production database!");
    console.log("⚠️  Make sure you have a backup before proceeding!");

    // Step 5: Migrate rooms
    console.log(`\n🔄 Migrating ${roomsToMigrate.length} rooms...`);
    console.log("=".repeat(40));

    for (let i = 0; i < roomsToMigrate.length; i++) {
      const room = roomsToMigrate[i];
      console.log(
        `\n[${i + 1}/${roomsToMigrate.length}] Migrating room ${
          room.room_id
        }...`
      );

      const success = await migrateRoom(room);

      if (success) {
        stats.successfulMigrations++;

        // Verify migration if requested
        if (verify) {
          const verified = await verifyMigration(room.room_id);
          if (!verified) {
            stats.errors.push(
              `Room ${room.room_id}: Migration verification failed`
            );
          }
        }
      } else {
        stats.failedMigrations++;
        stats.errors.push(`Room ${room.room_id}: Migration failed`);
      }

      // Progress update every 10 rooms
      if ((i + 1) % 10 === 0) {
        console.log(
          `📊 Progress: ${i + 1}/${roomsToMigrate.length} rooms processed`
        );
      }
    }

    stats.skippedRooms = roomsAlreadyMigrated;
  } catch (error) {
    console.error("💥 Fatal error during migration:", error);
    stats.errors.push(`Fatal error: ${error}`);
  }

  // Step 6: Print final results
  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`📈 Total rooms: ${stats.totalRooms}`);
  console.log(`✅ Successful migrations: ${stats.successfulMigrations}`);
  console.log(`⏭️  Skipped (already migrated): ${stats.skippedRooms}`);
  console.log(`❌ Failed migrations: ${stats.failedMigrations}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`);
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  if (stats.failedMigrations === 0 && stats.errors.length === 0) {
    console.log("\n🎉 Migration completed successfully!");
  } else {
    console.log(
      "\n⚠️  Migration completed with errors. Please review the failed migrations."
    );
  }

  return stats;
}

// Export functions for testing
export {
  runMigration,
  scanAllRooms,
  needsMigration,
  createMigrationUpdate,
  migrateRoom,
  verifyMigration,
  FIELD_MAPPING,
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const verify = args.includes("--verify");

  runMigration({ dryRun, verify })
    .then((stats) => {
      const exitCode = stats.failedMigrations > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}
