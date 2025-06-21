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
const MAX_IMAGES_PER_CATEGORY = 5; // For character category
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const PARALLEL_UPLOAD_LIMIT = 3; // Upload max 3 images in parallel to avoid timeouts

// Valid categories from the original route
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

// Interface matching the original route.ts
interface ImageData {
  [categoryId: string]: string | string[]; // base64 images from sessionStorage
}

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
    // Remove data:image/...;base64, prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

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

// Get content type and file extension based on image data
function getContentTypeAndExtension(imageData: string): {
  contentType: string;
  extension: string;
} {
  // Remove data:image/...;base64, prefix if present
  const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // Detect format from binary data
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  if (buffer.toString("ascii", 8, 12) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00) {
    return { contentType: "image/avif", extension: "avif" };
  }

  // Fallback to JPEG if format not detected
  return { contentType: "image/jpeg", extension: "jpg" };
}

// Get content type based on image data (kept for backward compatibility)
function getContentType(imageData: string): string {
  return getContentTypeAndExtension(imageData).contentType;
}

// Upload single image to S3 with the same structure as route.ts
async function uploadImageToS3(
  base64Image: string,
  filenameWithoutExtension: string
): Promise<string> {
  // Remove data:image/...;base64, prefix if present
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const { contentType, extension } = getContentTypeAndExtension(base64Image);

  // Add correct extension to filename
  const filename = `${filenameWithoutExtension}.${extension}`;

  const putObjectParams: PutObjectCommandInput = {
    Bucket: process.env.S3_BUCKET!,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    // Match the original route.ts settings
    ACL: "public-read",
    // Optimized S3 settings
    CacheControl: "public, max-age=31536000", // 1 year cache
    Metadata: {
      uploadedAt: new Date().toISOString(),
      originalFormat: extension,
    },
    // Enable server-side encryption
    ServerSideEncryption: "AES256",
  };

  const command = new PutObjectCommand(putObjectParams);

  try {
    await s3Client.send(command);

    const url = `https://${process.env.S3_BUCKET}.s3.${
      process.env.AWS_REGION || "us-east-2"
    }.amazonaws.com/${filename}`;

    console.log(
      `✅ Successfully uploaded: ${filename} (${buffer.length} bytes, ${contentType})`
    );

    return url;
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error);
    throw new Error(
      `Failed to upload ${filename}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Process images with the same logic as route.ts
async function processImages(
  roomId: string,
  userRole: string,
  images: ImageData
): Promise<{
  uploadedUrls: { [categoryId: string]: string | string[] };
  uploadCount: number;
  totalImages: number;
}> {
  const uploadedUrls: { [categoryId: string]: string | string[] } = {};
  let uploadCount = 0;
  const totalImages = Object.values(images).flat().length;

  console.log(
    `📊 Processing ${totalImages} images for ${userRole} in room: ${roomId}`
  );

  // Process each category (matching route.ts logic exactly)
  for (const [categoryId, imageData] of Object.entries(images)) {
    try {
      if (Array.isArray(imageData)) {
        // Character category with multiple images
        const uploadedImageUrls: string[] = [];

        for (let i = 0; i < imageData.length; i++) {
          const base64Image = imageData[i] as string;
          // Same filename structure as route.ts (without extension, will be added based on format)
          const filenameWithoutExtension = `${roomId}/${userRole}/${categoryId}/${
            i + 1
          }`;
          const url = await uploadImageToS3(
            base64Image,
            filenameWithoutExtension
          );
          uploadedImageUrls.push(url);
          uploadCount++;

          console.log(
            `Uploaded ${categoryId}[${i + 1}]: ${uploadCount}/${totalImages}`
          );
        }

        uploadedUrls[categoryId] = uploadedImageUrls;
      } else {
        // Single image category
        // Same filename structure as route.ts (without extension, will be added based on format)
        const filenameWithoutExtension = `${roomId}/${userRole}/${categoryId}/main`;
        const url = await uploadImageToS3(
          imageData as string,
          filenameWithoutExtension
        );
        uploadedUrls[categoryId] = url;
        uploadCount++;

        console.log(`Uploaded ${categoryId}: ${uploadCount}/${totalImages}`);
      }
    } catch (error) {
      console.error(`Failed to upload ${categoryId}:`, error);
      // Continue with other categories even if one fails (same as route.ts)
    }
  }

  return { uploadedUrls, uploadCount, totalImages };
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

    // Parse request body - matching route.ts contract
    const { roomId, userRole, images } = JSON.parse(event.body);

    // Validation matching route.ts
    if (!roomId || !userRole || !images) {
      return errorResponse(400, "Room ID, user role, and images are required");
    }

    if (typeof roomId !== "string" || typeof userRole !== "string") {
      return errorResponse(400, "roomId and userRole must be strings");
    }

    if (typeof images !== "object" || images === null) {
      return errorResponse(400, "images must be an object");
    }

    console.log(`Starting upload process for ${userRole} in room ${roomId}`);
    console.log(
      `Number of categories with images: ${Object.keys(images).length}`
    );

    // Validate categories
    const invalidCategories = Object.keys(images).filter(
      (category) => !VALID_CATEGORIES.includes(category)
    );

    if (invalidCategories.length > 0) {
      return errorResponse(
        400,
        `Invalid categories: ${invalidCategories.join(
          ", "
        )}. Valid categories: ${VALID_CATEGORIES.join(", ")}`
      );
    }

    // Validate all images first
    const validationErrors: string[] = [];
    let totalSize = 0;

    for (const [categoryId, imageData] of Object.entries(images)) {
      if (Array.isArray(imageData)) {
        if (imageData.length > MAX_IMAGES_PER_CATEGORY) {
          validationErrors.push(
            `Category ${categoryId}: Maximum ${MAX_IMAGES_PER_CATEGORY} images allowed`
          );
          continue;
        }

        for (let i = 0; i < imageData.length; i++) {
          const validation = validateImageData(imageData[i] as string);
          if (!validation.isValid) {
            validationErrors.push(
              `${categoryId}[${i + 1}]: ${validation.error}`
            );
          } else {
            totalSize += validation.size!;
          }
        }
      } else {
        const validation = validateImageData(imageData as string);
        if (!validation.isValid) {
          validationErrors.push(`${categoryId}: ${validation.error}`);
        } else {
          totalSize += validation.size!;
        }
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
    //   const rateLimitKey = `upload:${roomId}:${userRole}`;
    //   const now = Date.now();
    //   const windowStart = now - 60000; // 1 minute window
    //
    //   await redis.zremrangebyscore(rateLimitKey, 0, windowStart);
    //   const requestCount = await redis.zcard(rateLimitKey);
    //
    //   if (requestCount >= 5) {
    //     return errorResponse(429, "Rate limit exceeded. Try again later.");
    //   }
    //
    //   await redis.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
    //   await redis.expire(rateLimitKey, 60);
    // } catch (redisError) {
    //   console.warn("⚠️ Redis rate limiting failed:", redisError);
    //   // Continue without rate limiting
    // }

    // Process images with same logic as route.ts
    const { uploadedUrls, uploadCount, totalImages } = await processImages(
      roomId,
      userRole,
      images
    );

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Successfully uploaded ${uploadCount} images in ${processingTime}ms`
    );
    console.log("@ `uploadImageToS3` uploadedUrls:", uploadedUrls);

    // Update DynamoDB (commented for now)
    // try {
    //   const success = await updateRoomImages(roomId, userRole, uploadedUrls);
    //   console.log("📝 DynamoDB updated successfully");
    // } catch (dbError) {
    //   console.warn("⚠️ DynamoDB update failed:", dbError);
    //   // Continue anyway - S3 upload succeeded
    // }

    console.log(
      `Upload complete for ${userRole}: ${uploadCount}/${totalImages} images uploaded`
    );

    // Return response matching route.ts format
    return successResponse({
      success: true,
      message: `Uploaded ${uploadCount} images successfully`,
      roomId,
      userRole,
      uploadCount,
      totalImages,
      uploadedUrls,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Error processing images:", error);

    return errorResponse(500, "Failed to upload images", {
      processingTimeMs: processingTime,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
