import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
// import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
// import { Redis } from "redis";

// Initialize AWS clients with optimized configuration
const s3Client = new S3Client({
  region: "us-east-2",
  // Enable request compression for better performance
  requestHandler: {
    requestTimeout: 30000, // 30 second timeout
  },
});

// const dynamoClient = new DynamoDBClient({ region: "us-east-2" });

// Redis client (commented for now)
// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: parseInt(process.env.REDIS_PORT || "6379"),
//   tls: process.env.REDIS_TLS === "true" ? { rejectUnauthorized: false } : undefined,
// });

// Constants
const MAX_IMAGES = 14;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const PARALLEL_UPLOAD_LIMIT = 3; // Upload max 3 images in parallel to avoid timeouts

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

// Error response with CORS
const errorResponse = (
  statusCode: number,
  message: string,
  details?: any
): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({
    error: message,
    ...(details && { details }),
  }),
});

// Success response with CORS
const successResponse = (data: any): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify(data),
});

// Validate base64 image data
function validateImageData(imageData: string): {
  isValid: boolean;
  error?: string;
  size?: number;
} {
  try {
    // Check if it's valid base64
    const buffer = Buffer.from(imageData, "base64");

    if (buffer.length === 0) {
      return { isValid: false, error: "Empty image data" };
    }

    if (buffer.length > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image too large. Max size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        size: buffer.length,
      };
    }

    // Basic image format validation (check for JPEG/PNG headers)
    const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPNG =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebP = buffer.toString("ascii", 8, 12) === "WEBP";
    const isAVIF =
      buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00;

    if (!isJPEG && !isPNG && !isWebP && !isAVIF) {
      return {
        isValid: false,
        error:
          "Invalid image format. Only JPEG, PNG, WebP, and AVIF are supported",
      };
    }

    return { isValid: true, size: buffer.length };
  } catch (error) {
    return { isValid: false, error: "Invalid base64 data" };
  }
}

// Get content type based on image data
function getContentType(imageData: string): string {
  const buffer = Buffer.from(imageData, "base64");

  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0xaf && buffer[1] === 0x00) return "image/avif";
  if (buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";

  return "image/jpeg"; // fallback
}

// Upload single image to S3 with optimized settings
async function uploadImageToS3(
  imageData: string,
  roomId: string,
  imageIndex: number
): Promise<{ url: string; key: string; size: number }> {
  const buffer = Buffer.from(imageData, "base64");
  const contentType = getContentType(imageData);
  const extension =
    contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const key = `${roomId}/image-${imageIndex}-${Date.now()}.${extension}`;

  const putObjectParams: PutObjectCommandInput = {
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Optimized S3 settings
    CacheControl: "public, max-age=31536000", // 1 year cache
    Metadata: {
      roomId,
      uploadedAt: new Date().toISOString(),
      originalIndex: imageIndex.toString(),
    },
    // Enable server-side encryption
    ServerSideEncryption: "AES256",
  };

  const command = new PutObjectCommand(putObjectParams);

  try {
    await s3Client.send(command);

    const url = `https://${process.env.S3_BUCKET}.s3.${
      process.env.AWS_REGION || "us-east-2"
    }.amazonaws.com/${key}`;

    console.log(
      `✅ Successfully uploaded image ${imageIndex + 1}: ${key} (${
        buffer.length
      } bytes)`
    );

    return { url, key, size: buffer.length };
  } catch (error) {
    console.error(`❌ Failed to upload image ${imageIndex + 1}:`, error);
    throw new Error(
      `Failed to upload image ${imageIndex + 1}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Process images in batches to avoid timeout
async function uploadImagesInBatches(
  images: string[],
  roomId: string
): Promise<{ url: string; key: string; size: number }[]> {
  const results: { url: string; key: string; size: number }[] = [];

  for (let i = 0; i < images.length; i += PARALLEL_UPLOAD_LIMIT) {
    const batch = images.slice(i, i + PARALLEL_UPLOAD_LIMIT);
    console.log(
      `📦 Processing batch ${Math.floor(i / PARALLEL_UPLOAD_LIMIT) + 1} with ${
        batch.length
      } images`
    );

    const batchPromises = batch.map((imageData, batchIndex) =>
      uploadImageToS3(imageData, roomId, i + batchIndex)
    );

    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      console.log(
        `✅ Batch ${
          Math.floor(i / PARALLEL_UPLOAD_LIMIT) + 1
        } completed successfully`
      );
    } catch (error) {
      console.error(
        `❌ Batch ${Math.floor(i / PARALLEL_UPLOAD_LIMIT) + 1} failed:`,
        error
      );
      throw error;
    }
  }

  return results;
}

// Main handler function
export const uploadImages = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  console.log("🚀 Upload images request received");

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    if (!event.body) {
      return errorResponse(400, "Request body is required");
    }

    const { roomId, images } = JSON.parse(event.body);

    // Validation
    if (!roomId || typeof roomId !== "string") {
      return errorResponse(400, "Valid roomId is required");
    }

    if (!images || !Array.isArray(images)) {
      return errorResponse(400, "images array is required");
    }

    if (images.length === 0) {
      return errorResponse(400, "At least one image is required");
    }

    if (images.length > MAX_IMAGES) {
      return errorResponse(400, `Maximum ${MAX_IMAGES} images allowed`);
    }

    console.log(`📊 Processing ${images.length} images for room: ${roomId}`);

    // Validate all images first
    const validationErrors: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < images.length; i++) {
      const validation = validateImageData(images[i]);
      if (!validation.isValid) {
        validationErrors.push(`Image ${i + 1}: ${validation.error}`);
      } else {
        totalSize += validation.size!;
      }
    }

    if (validationErrors.length > 0) {
      return errorResponse(400, "Image validation failed", {
        errors: validationErrors,
      });
    }

    console.log(
      `📏 Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`
    );

    // Rate limiting check (commented for now)
    // try {
    //   const rateLimitKey = `upload:${roomId}`;
    //   const now = Date.now();
    //   const windowStart = now - 60000; // 1 minute window
    //
    //   await redis.zremrangebyscore(rateLimitKey, 0, windowStart);
    //   const requestCount = await redis.zcard(rateLimitKey);
    //
    //   if (requestCount >= 10) {
    //     return errorResponse(429, "Rate limit exceeded. Try again later.");
    //   }
    //
    //   await redis.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
    //   await redis.expire(rateLimitKey, 60);
    // } catch (redisError) {
    //   console.warn("⚠️ Redis rate limiting failed:", redisError);
    //   // Continue without rate limiting
    // }

    // Upload images to S3 in optimized batches
    const uploadResults = await uploadImagesInBatches(images, roomId);

    const totalUploadedSize = uploadResults.reduce(
      (sum, result) => sum + result.size,
      0
    );
    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Successfully uploaded ${uploadResults.length} images in ${processingTime}ms`
    );
    console.log(
      `📊 Total size: ${(totalUploadedSize / 1024 / 1024).toFixed(2)}MB`
    );

    // Update DynamoDB (commented for now)
    // try {
    //   const imageUrls = uploadResults.map(result => result.url);
    //   const updateCommand = new UpdateItemCommand({
    //     TableName: process.env.DYNAMODB_TABLE!,
    //     Key: {
    //       roomId: { S: roomId },
    //     },
    //     UpdateExpression: "SET images = :images, updatedAt = :updatedAt, imageCount = :count",
    //     ExpressionAttributeValues: {
    //       ":images": { SS: imageUrls },
    //       ":updatedAt": { S: new Date().toISOString() },
    //       ":count": { N: uploadResults.length.toString() },
    //     },
    //   });

    //   await dynamoClient.send(updateCommand);
    //   console.log("📝 DynamoDB updated successfully");
    // } catch (dbError) {
    //   console.warn("⚠️ DynamoDB update failed:", dbError);
    //   // Continue anyway - S3 upload succeeded
    // }

    return successResponse({
      message: `Successfully uploaded ${uploadResults.length} images`,
      roomId,
      images: uploadResults.map((result) => ({
        url: result.url,
        key: result.key,
        size: result.size,
      })),
      stats: {
        totalImages: uploadResults.length,
        totalSize: totalUploadedSize,
        processingTimeMs: processingTime,
        averageSizePerImage: Math.round(
          totalUploadedSize / uploadResults.length
        ),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Error processing images:", error);

    return errorResponse(500, "Internal server error", {
      processingTimeMs: processingTime,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
