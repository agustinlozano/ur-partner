import { dynamoDb, TABLES } from "../lib/dynamodb";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";

async function testConnection() {
  try {
    console.log("🔍 Testing DynamoDB connection...");
    console.log("📋 Table name:", TABLES.ROOMS);

    // Test table access
    const command = new DescribeTableCommand({
      TableName: TABLES.ROOMS,
    });

    const result = await dynamoDb.send(command);

    console.log("✅ Connection successful!");
    console.log("📊 Table status:", result.Table?.TableStatus);
    console.log("🔑 Partition key:", result.Table?.KeySchema?.[0]);
    console.log(
      "💾 Billing mode:",
      result.Table?.BillingModeSummary?.BillingMode || "PROVISIONED"
    );
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error(error);

    if (error instanceof Error) {
      if (error.name === "AccessDeniedException") {
        console.log("\n🔧 Solution: Add DynamoDB permissions to your AWS user");
        console.log("   1. Go to AWS IAM Console");
        console.log("   2. Find user 'up-partner-uploader'");
        console.log("   3. Attach 'AmazonDynamoDBFullAccess' policy");
      } else if (error.name === "ResourceNotFoundException") {
        console.log("\n🔧 Solution: Create the DynamoDB table");
        console.log("   1. Go to AWS DynamoDB Console");
        console.log("   2. Create table named 'Rooms'");
        console.log("   3. Set partition key as 'room_id' (String)");
      }
    }
  }
}

testConnection()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
