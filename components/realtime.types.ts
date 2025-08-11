export type UploadedImage = {
  category: string;
  fileName: string;
  base64: string;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  originalSize: number;
  timestamp: number;
  hasImage: boolean;
};

export type RoomEvent =
  | { type: "category_fixed"; slot: "a" | "b"; category: string }
  | { type: "category_completed"; slot: "a" | "b"; category: string }
  | { type: "category_uncompleted"; slot: "a" | "b"; category: string }
  | { type: "progress_updated"; slot: "a" | "b"; progress: number }
  | { type: "image_uploaded"; slot: "a" | "b"; payload: UploadedImage }
  | { type: "is_ready"; slot: "a" | "b" }
  | { type: "not_ready"; slot: "a" | "b" }
  | { type: "say"; slot: "a" | "b"; message: string }
  | { type: "ping"; slot: "a" | "b" }
  | { type: "leave"; slot: "a" | "b" }
  | { type: "get_in"; slot: "a" | "b" };

export type Options = {
  onMessage?: (event: RoomEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
};

export type GameState = {
  mySlot: "a" | "b";
  partnerSlot: "a" | "b";
  myFixedCategory: string | null;
  partnerFixedCategory: string | null;
  myCompletedCategories: string[];
  partnerCompletedCategories: string[];
  myProgress: number;
  partnerProgress: number;
  myReady: boolean;
  partnerReady: boolean;
  connected: boolean;
  chatMessages: Array<{ slot: "a" | "b"; message: string; timestamp: number }>;
};
