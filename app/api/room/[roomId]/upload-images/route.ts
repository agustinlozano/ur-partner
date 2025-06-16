import { NextRequest } from "next/server";
import { S3 } from "aws-sdk";
import { findRoomByRoomId, updateRoomImages } from "@/lib/dynamodb";

interface ImageData {
  [categoryId: string]: string | string[]; // base64 images from sessionStorage
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { userRole, images } = body;

    if (!roomId || !userRole || !images) {
      return Response.json(
        { error: "Room ID, user role, and images are required" },
        { status: 400 }
      );
    }

    console.log(`Starting upload process for ${userRole} in room ${roomId}`);
    console.log(
      `Number of categories with images: ${Object.keys(images).length}`
    );

    // Check if images are already uploaded to avoid duplicates
    const existingUrls = await checkExistingImageUrls(roomId, userRole);
    if (existingUrls && Object.keys(existingUrls).length > 0) {
      console.log(`Images already uploaded for ${userRole} in room ${roomId}`);
      return Response.json({
        success: true,
        message: "Images already uploaded",
        roomId,
        userRole,
        uploadCount: Object.values(existingUrls).flat().length,
        totalImages: Object.values(images).flat().length,
        uploadedUrls: existingUrls,
        alreadyExists: true,
      });
    }

    const uploadedUrls: { [categoryId: string]: string | string[] } = {};
    let uploadCount = 0;
    const totalImages = Object.values(images).flat().length;

    // Subir cada imagen a AWS S3
    for (const [categoryId, imageData] of Object.entries(images)) {
      try {
        if (Array.isArray(imageData)) {
          // Character category with multiple images
          const uploadedImageUrls: string[] = [];

          for (let i = 0; i < imageData.length; i++) {
            const base64Image = imageData[i] as string;
            const filename = `${roomId}/${userRole}/${categoryId}/${i + 1}.jpg`;
            const url = await uploadImageToS3(base64Image, filename);
            console.log("@ `uploadImageToS3` URL:", url);
            uploadedImageUrls.push(url);
            uploadCount++;

            console.log(
              `Uploaded ${categoryId}[${i + 1}]: ${uploadCount}/${totalImages}`
            );
          }

          uploadedUrls[categoryId] = uploadedImageUrls;
        } else {
          // Single image category
          const filename = `${roomId}/${userRole}/${categoryId}/main.jpg`;
          const url = await uploadImageToS3(imageData as string, filename);
          uploadedUrls[categoryId] = url;
          uploadCount++;

          console.log(`Uploaded ${categoryId}: ${uploadCount}/${totalImages}`);
        }
      } catch (error) {
        console.error(`Failed to upload ${categoryId}:`, error);
        // Continue with other categories even if one fails
      }
    }

    console.log("@ `uploadImageToS3` uploadedUrls:", uploadedUrls);

    // Store the uploaded URLs in DynamoDB for later retrieval
    const success = await updateRoomImages(roomId, userRole, uploadedUrls);

    console.log(
      `Upload complete for ${userRole}: ${uploadCount}/${totalImages} images uploaded`
    );

    return Response.json({
      success,
      message: `Uploaded ${uploadCount} images successfully`,
      roomId,
      userRole,
      uploadCount,
      totalImages,
      uploadedUrls,
    });
  } catch (error) {
    console.error("Error in upload process:", error);
    return Response.json({ error: "Failed to upload images" }, { status: 500 });
  }
}

// Helper function to upload images to AWS S3
async function uploadImageToS3(
  base64Image: string,
  filename: string
): Promise<string> {
  try {
    // Configuración de AWS desde variables de entorno
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket)
      throw new Error("AWS_S3_BUCKET no definido en variables de entorno");

    // Convertir base64 a buffer
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Subir a S3
    const uploadResult = await s3
      .upload({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
      .promise();

    return uploadResult.Location;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Variables de entorno necesarias para AWS S3:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET
 */

// Helper function to check if images are already uploaded
async function checkExistingImageUrls(
  roomId: string,
  userRole: string
): Promise<{ [categoryId: string]: string | string[] } | null> {
  try {
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return null;
    }

    const categories = [
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

    const existingUrls: { [key: string]: string | string[] } = {};
    let hasAnyUrls = false;

    for (const category of categories) {
      const columnKey = `${category}_${userRole}` as keyof typeof room;
      const imageData = room[columnKey];

      if (imageData && typeof imageData === "string" && imageData.trim()) {
        try {
          // Try to parse as JSON (for character category with multiple images)
          const parsed = JSON.parse(imageData);
          if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed[0].startsWith("http")
          ) {
            existingUrls[category] = parsed;
            hasAnyUrls = true;
          } else if (typeof parsed === "string" && parsed.startsWith("http")) {
            existingUrls[category] = parsed;
            hasAnyUrls = true;
          }
        } catch {
          // If not JSON, check if it's a direct URL
          if (imageData.startsWith("http")) {
            existingUrls[category] = imageData;
            hasAnyUrls = true;
          }
        }
      }
    }

    return hasAnyUrls ? existingUrls : null;
  } catch (error) {
    console.error("Error checking existing image URLs:", error);
    return null;
  }
}
