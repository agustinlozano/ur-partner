import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { createClient } from "redis";

// Initialize AWS clients
const s3Client = new S3Client({ region: "us-east-2" });
const dynamoClient = new DynamoDBClient({ region: "us-east-2" });

// Redis client with TLS for ElastiCache Serverless
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    tls: process.env.REDIS_TLS === "true",
  },
});

// Rate limiting function
async function checkRateLimit(
  roomId: string,
  limit: number = 10
): Promise<boolean> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const key = `rate_limit:${roomId}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Use Redis transaction
    const tx = redisClient.multi();
    tx.zRemRangeByScore(key, 0, windowStart);
    tx.zAdd(key, { score: now, value: now.toString() });
    tx.zCard(key);
    tx.expire(key, 60);

    const results = await tx.exec();

    if (!results) {
      console.warn("Redis transaction returned null");
      return false;
    }

    const zcardResult = results[2];
    if (!zcardResult || zcardResult.error) {
      console.error("Redis zcard command failed:", zcardResult?.error);
      return false;
    }

    const count = zcardResult.reply as number;
    return count <= limit;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return false; // Fail closed
  }
}

// Main handler function
export const uploadImages = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    "Upload images request received:",
    JSON.stringify(event, null, 2)
  );

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    // Handle preflight request
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { roomId, images } = JSON.parse(event.body);

    if (!roomId || !images || !Array.isArray(images)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "roomId and images array are required" }),
      };
    }

    // Check rate limit
    const isAllowed = await checkRateLimit(roomId, 10);
    if (!isAllowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
      };
    }

    // Upload images to S3
    const uploadPromises = images.map(
      async (imageData: string, index: number) => {
        const buffer = Buffer.from(imageData, "base64");
        const key = `${roomId}/${Date.now()}-${index}.jpg`;

        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: "image/jpeg",
        });

        await s3Client.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.us-east-2.amazonaws.com/${key}`;
      }
    );

    const imageUrls = await Promise.all(uploadPromises);

    // Update DynamoDB
    const updateCommand = new UpdateItemCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { roomId: { S: roomId } },
      UpdateExpression: "SET images = :images, lastUpdated = :timestamp",
      ExpressionAttributeValues: {
        ":images": { SS: imageUrls },
        ":timestamp": { S: new Date().toISOString() },
      },
    });

    await dynamoClient.send(updateCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Images uploaded successfully",
        urls: imageUrls,
      }),
    };
  } catch (error) {
    console.error("Error uploading images:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
