"use server";

import {
  joinRoomDynamoDB,
  createRoomAndRedirect as createRoomAndRedirectDynamoDB,
  joinRoomAndRedirect as joinRoomAndRedirectDynamoDB,
  getRoomDataDynamoDB,
  setActiveRoomData as setActiveRoomDataDynamoDB,
} from "./actions-dynamodb";
import { USE_LAMBDA_UPLOAD, LAMBDA_UPLOAD_ENDPOINT } from "./env";

export interface CreateRoomInput {
  role: "girlfriend" | "boyfriend";
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
  role?: "girlfriend" | "boyfriend";
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
}

export async function joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
  return await joinRoomDynamoDB(input);
}

// New function to save active room data to localStorage via client-side
export async function setActiveRoomData(
  roomId: string,
  role: "girlfriend" | "boyfriend",
  name: string,
  emoji: string
) {
  return await setActiveRoomDataDynamoDB(roomId, role, name, emoji);
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

export async function checkPartnerImages(
  roomId: string,
  userRole: string
): Promise<PartnerImagesResult> {
  try {
    const response = await fetch(
      `/api/room/${roomId}/partner-images?userRole=${userRole}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        isReady: data.isReady,
        images: data.images,
        partnerRole: data.partnerRole,
        totalImages: data.totalImages,
        categoriesCompleted: data.categoriesCompleted,
      };
    } else {
      return {
        success: false,
        isReady: false,
        error: data.error || "Failed to check partner images",
      };
    }
  } catch (error) {
    console.error("Error checking partner images:", error);
    return {
      success: false,
      isReady: false,
      error: "Failed to connect to server",
    };
  }
}

export async function uploadImages(
  roomId: string,
  userRole: string,
  images: Record<string, any>
): Promise<UploadImagesResult> {
  try {
    let response: Response;

    if (USE_LAMBDA_UPLOAD && LAMBDA_UPLOAD_ENDPOINT) {
      response = await fetch(LAMBDA_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userRole,
          images,
        }),
      });
    } else {
      response = await fetch(`/api/room/${roomId}/upload-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRole,
          images,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: data.success || false,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    console.error("Error uploading images:", error);
    return {
      success: false,
      error: "Failed to connect to server",
    };
  }
}
