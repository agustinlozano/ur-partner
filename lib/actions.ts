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
