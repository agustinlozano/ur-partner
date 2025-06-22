import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: "us-east-2" });

// Interface for room updates
interface RoomUpdates {
  [key: string]: string;
}

// Valid user roles
type UserRole = "player1" | "player2" | "girlfriend" | "boyfriend";

// Categories that map to DynamoDB fields
const VALID_CATEGORIES = [
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

/**
 * Update room images in DynamoDB
 * Maps uploaded URLs to the corresponding DynamoDB fields based on category and user role
 *
 * @param roomId - The room ID
 * @param userRole - The user role (player1, player2, girlfriend, boyfriend)
 * @param uploadedUrls - Object with category as key and URL(s) as value
 * @returns Promise<boolean> - Success status
 */
export const updateRoomImages = async (
  roomId: string,
  userRole: UserRole,
  uploadedUrls: { [categoryId: string]: string | string[] }
): Promise<boolean> => {
  try {
    const updates: RoomUpdates = {};

    // Map the URLs to the corresponding DynamoDB fields
    Object.entries(uploadedUrls).forEach(([categoryId, urls]) => {
      // Validate category
      if (!VALID_CATEGORIES.includes(categoryId)) {
        console.warn(`⚠️ Invalid category ${categoryId}, skipping`);
        return;
      }

      const fieldName = `${categoryId}_${userRole}`;

      // If it's an array (like character), convert to JSON string
      if (Array.isArray(urls)) {
        updates[fieldName] = JSON.stringify(urls);
      } else {
        updates[fieldName] = urls;
      }
    });

    if (Object.keys(updates).length === 0) {
      console.warn("⚠️ No valid updates to apply");
      return false;
    }

    // Build the UpdateExpression and ExpressionAttributeValues
    const updateExpressions: string[] = [];
    const expressionAttributeValues: { [key: string]: any } = {};

    Object.entries(updates).forEach(([fieldName, value]) => {
      updateExpressions.push(`${fieldName} = :${fieldName}`);
      expressionAttributeValues[`:${fieldName}`] = { S: value };
    });

    // Add updatedAt timestamp
    updateExpressions.push("updatedAt = :updatedAt");
    expressionAttributeValues[":updatedAt"] = { S: new Date().toISOString() };

    const updateCommand = new UpdateItemCommand({
      TableName: process.env.DYNAMODB_TABLE!,
      Key: {
        roomId: { S: roomId },
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
    });

    const result = await dynamoClient.send(updateCommand);

    console.log(`✅ DynamoDB updated successfully for room ${roomId}`);
    console.log(`📝 Updated fields: ${Object.keys(updates).join(", ")}`);

    return true;
  } catch (error) {
    console.error("❌ Error updating room images in DynamoDB:", error);
    return false;
  }
};
