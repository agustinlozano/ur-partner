import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function createTable() {
  try {
    // First, create the table
    const createCommand = new CreateTableCommand({
      TableName: "ur-partner-rooms",
      KeySchema: [
        {
          AttributeName: "room_id",
          KeyType: "HASH", // Partition key
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "room_id",
          AttributeType: "S",
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });

    const result = await client.send(createCommand);
    console.log("Table created successfully:", result);
    console.log("Table ARN:", result.TableDescription?.TableArn);
    console.log("Table Status:", result.TableDescription?.TableStatus);

    // Wait a bit for the table to be active
    console.log("Waiting for table to be active...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Then enable TTL
    const ttlCommand = new UpdateTimeToLiveCommand({
      TableName: "ur-partner-rooms",
      TimeToLiveSpecification: {
        AttributeName: "ttl",
        Enabled: true,
      },
    });

    const ttlResult = await client.send(ttlCommand);
    console.log("TTL enabled successfully:", ttlResult);
  } catch (error) {
    if (error instanceof Error && error.name === "ResourceInUseException") {
      console.log("Table already exists!");
    } else {
      console.error("Error creating table:", error);
    }
  }
}

// Run the script
createTable()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
