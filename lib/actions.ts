"use server";

import {
  createRoomAndRedirect as createRoomAndRedirectDynamoDB,
  joinRoomAndRedirect as joinRoomAndRedirectDynamoDB,
  getRoomDataDynamoDB,
} from "./actions-dynamodb";
import { RelationshipRole } from "./role-utils";

export interface CreateRoomInput {
  role: RelationshipRole;
  name: string;
  emoji: string;
}

export interface CreateRoomResult {
  success: boolean;
  room_id?: string;
  error?: string;
}

export interface JoinRoomInput {
  roomId: string;
  name: string;
  emoji: string;
}

export interface JoinRoomResult {
  success: boolean;
  room_id?: string;
  role?: RelationshipRole;
  error?: string;
}

export interface PartnerImagesResult {
  success: boolean;
  isReady: boolean;
  images?: any;
  partnerRole?: string;
  totalImages?: number;
  categoriesCompleted?: number;
  error?: string;
}

export interface UploadImagesResult {
  success: boolean;
  message?: string;
  error?: string;
  rateLimitInfo?: {
    retryAfter: number; // Seconds to wait before retry
  };
}

export async function createRoomAndRedirect(formData: FormData) {
  return await createRoomAndRedirectDynamoDB(formData);
}

export async function joinRoomAndRedirect(formData: FormData) {
  return await joinRoomAndRedirectDynamoDB(formData);
}

export async function getRoomData(roomId: string) {
  return await getRoomDataDynamoDB(roomId);
}

/**
 * Server action to securely fetch partner images without exposing S3 URLs
 * and convert them to base64 for optimal UX (all images load at once)
 */
export async function fetchPartnerImagesSecure(
  roomId: string,
  userSlot: string
): Promise<{
  success: boolean;
  isReady: boolean;
  images?: { [category: string]: string | string[] };
  partnerRole?: string;
  totalImages?: number;
  categoriesCompleted?: number;
  error?: string;
}> {
  try {
    // Import the DynamoDB function and types
    const { findRoomByRoomId } = await import("./dynamodb");
    const { PERSONALITY_CATEGORIES } = await import("./role-utils");

    // Validate input
    if (!roomId || !userSlot) {
      return {
        success: false,
        isReady: false,
        error: "Room ID and user slot are required",
      };
    }

    // Validate user slot
    const validSlots = ["a", "b"];
    if (!validSlots.includes(userSlot)) {
      return {
        success: false,
        isReady: false,
        error: `Invalid user slot: ${userSlot}`,
      };
    }

    // Find room data to get the stored image URLs
    const room = await findRoomByRoomId(roomId);
    if (!room) {
      return {
        success: false,
        isReady: false,
        error: "Room not found",
      };
    }

    const partnerSlot = userSlot === "a" ? "b" : "a";
    const partnerImages: { [key: string]: string | string[] } = {};
    let totalImagesFound = 0;

    // Helper function to check if a string is a date
    const isDateString = (str: string): boolean => {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (isoDateRegex.test(str)) return true;
      const date = new Date(str);
      return !isNaN(date.getTime()) && str.length > 10;
    };

    // Helper function to validate if a string is a valid image URL
    const isValidImageUrl = (url: string): boolean => {
      if (!url || typeof url !== "string") return false;
      try {
        new URL(url);
      } catch {
        return false;
      }
      if (!url.startsWith("http://") && !url.startsWith("https://"))
        return false;
      if (isDateString(url)) return false;
      return true;
    };

    // Extract image URLs from room data
    for (const category of PERSONALITY_CATEGORIES) {
      const columnKey = `${category}_${partnerSlot}` as keyof typeof room;
      const imageData = room[columnKey];

      if (imageData && typeof imageData === "string" && imageData.trim()) {
        if (isDateString(imageData.trim())) continue;

        try {
          const parsed = JSON.parse(imageData);
          if (Array.isArray(parsed)) {
            const validUrls = parsed.filter((url) => isValidImageUrl(url));
            if (validUrls.length > 0) {
              partnerImages[category] = validUrls;
              totalImagesFound += validUrls.length;
            }
          } else if (isValidImageUrl(parsed)) {
            partnerImages[category] = parsed;
            totalImagesFound += 1;
          }
        } catch {
          if (isValidImageUrl(imageData.trim())) {
            partnerImages[category] = imageData.trim();
            totalImagesFound += 1;
          }
        }
      }
    }

    const isReady = Object.keys(partnerImages).length >= 9;

    if (!isReady) {
      return {
        success: false,
        isReady: false,
        error: "Partner images are not ready yet",
      };
    }

    // Convert all image URLs to base64
    const convertedImages: { [category: string]: string | string[] } = {};

    for (const [category, urls] of Object.entries(partnerImages)) {
      if (Array.isArray(urls)) {
        // Handle array of URLs (like character category)
        const base64Array: string[] = [];
        for (const url of urls) {
          try {
            const imageResponse = await fetch(url as string);
            if (imageResponse.ok) {
              const blob = await imageResponse.blob();
              const buffer = await blob.arrayBuffer();
              const base64 = Buffer.from(buffer).toString("base64");
              const mimeType = blob.type || "image/jpeg";
              base64Array.push(`data:${mimeType};base64,${base64}`);
            } else {
              console.warn(`Failed to fetch image: ${url}`);
            }
          } catch (error) {
            console.warn(`Error fetching image ${url}:`, error);
          }
        }
        if (base64Array.length > 0) {
          convertedImages[category] = base64Array;
        }
      } else {
        // Handle single URL
        try {
          const imageResponse = await fetch(urls as string);
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = blob.type || "image/jpeg";
            convertedImages[category] = `data:${mimeType};base64,${base64}`;
          } else {
            console.warn(`Failed to fetch image: ${urls}`);
          }
        } catch (error) {
          console.warn(`Error fetching image ${urls}:`, error);
        }
      }
    }

    return {
      success: true,
      isReady: true,
      images: convertedImages,
      partnerRole: "partner",
      totalImages: totalImagesFound,
      categoriesCompleted: Object.keys(convertedImages).length,
    };
  } catch (error) {
    console.error("Error fetching partner images securely:", error);
    return {
      success: false,
      isReady: false,
      error: "Failed to fetch partner images securely",
    };
  }
}

// Resource map for secure fetching by slug
const RESOURCE_MAP: Record<string, { name: string; url: string }> = {
  "hover-card-demo": {
    name: "Hover Card Demo",
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/hover-card-demo.mp4",
  },
  "creating-room": {
    name: "Creating Room",
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/1-creating-room.mp4",
  },
  "copy-share-link": {
    name: "Copy & Share Link",
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/2-copy-link.mp4",
  },
  "join-room": {
    name: "Join Room",
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/3-join.mp4",
  },
};

export interface FetchResourceResult {
  success: boolean;
  slug?: string;
  name?: string;
  dataUrl?: string;
  error?: string;
}

/**
 * Server action to securely fetch a resource by slug, convert to base64 data URL, and return slug, name, and dataUrl.
 */
export async function fetchResourceBySlug(
  slug: string
): Promise<FetchResourceResult> {
  try {
    if (!slug || typeof slug !== "string") {
      return { success: false, error: "Slug is required" };
    }
    const resource = RESOURCE_MAP[slug];
    if (!resource) {
      return { success: false, error: `Resource not found for slug: ${slug}` };
    }
    const response = await fetch(resource.url);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch resource: ${resource.name}`,
      };
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = blob.type || inferMimeType(resource.url);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    return {
      success: true,
      slug,
      name: resource.name,
      dataUrl,
    };
  } catch (error) {
    console.error("Error fetching resource by slug:", error);
    return { success: false, error: "Failed to fetch resource" };
  }
}

// Helper to infer MIME type from file extension if blob.type is missing
function inferMimeType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  return "application/octet-stream";
}

export interface FetchResourcesResult {
  success: boolean;
  resources?: FetchResourceResult[];
  error?: string;
}

/**
 * Server action to securely fetch multiple resources by slugs, convert to base64 data URLs.
 */
export async function fetchResourcesBySlug(
  slugs: string[]
): Promise<FetchResourcesResult> {
  try {
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return { success: false, error: "Slugs array is required" };
    }

    const results = await Promise.all(
      slugs.map((slug) => fetchResourceBySlug(slug))
    );

    const hasAnyFailure = results.some((result) => !result.success);

    return {
      success: !hasAnyFailure,
      resources: results,
      error: hasAnyFailure ? "Some resources failed to fetch" : undefined,
    };
  } catch (error) {
    console.error("Error fetching resources by slugs:", error);
    return { success: false, error: "Failed to fetch resources" };
  }
}
