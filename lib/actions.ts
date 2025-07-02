"use server";

import {
  createRoomAndRedirect as createRoomAndRedirectDynamoDB,
  joinRoomAndRedirect as joinRoomAndRedirectDynamoDB,
  getRoomDataDynamoDB,
  setActiveRoomData as setActiveRoomDataDynamoDB,
} from "./actions-dynamodb";

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
  rateLimitInfo?: {
    retryAfter: number; // Seconds to wait before retry
  };
}

// New function to save active room data to localStorage via client-side
export async function setActiveRoomData(
  roomId: string,
  role: "girlfriend" | "boyfriend",
  name: string,
  emoji: string,
  slot: "a" | "b" = "a"
) {
  return await setActiveRoomDataDynamoDB(roomId, role, name, emoji, slot);
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
