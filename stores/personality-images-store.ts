import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UploadedImages } from "@/lib/personality-form-constants";

interface PersonalityImagesState {
  // Images stored by roomId and userRole: roomId_userRole -> UploadedImages
  imagesByRoom: Record<string, UploadedImages>;

  // Actions
  setImagesForRoom: (
    roomId: string,
    userRole: string,
    images: UploadedImages
  ) => void;
  getImagesForRoom: (roomId: string, userRole: string) => UploadedImages;
  clearImagesForRoom: (roomId: string, userRole: string) => void;
  clearAllImages: () => void;
}

// Simple storage with basic quota handling
const storage = {
  getItem: (name: string) => {
    try {
      const value = sessionStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("Failed to parse storage item:", error);
      return null;
    }
  },

  setItem: (name: string, value: any) => {
    try {
      sessionStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.warn("Storage quota exceeded. Clearing old data...");

        // Simple cleanup - remove all other personality storage entries
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("personality-images-storage") && key !== name) {
            sessionStorage.removeItem(key);
          }
        });

        // Try one more time
        try {
          sessionStorage.setItem(name, JSON.stringify(value));
        } catch (retryError) {
          console.error("Failed to save even after cleanup:", retryError);
        }
      } else {
        console.error("Failed to save to storage:", error);
      }
    }
  },

  removeItem: (name: string) => {
    try {
      sessionStorage.removeItem(name);
    } catch (error) {
      console.warn("Failed to remove storage item:", error);
    }
  },
};

export const usePersonalityImagesStore = create<PersonalityImagesState>()(
  persist(
    (set, get) => ({
      imagesByRoom: {},

      setImagesForRoom: (
        roomId: string,
        userRole: string,
        images: UploadedImages
      ) => {
        const key = `${roomId}_${userRole}`;
        set((state) => ({
          imagesByRoom: {
            ...state.imagesByRoom,
            [key]: images,
          },
        }));
      },

      getImagesForRoom: (roomId: string, userRole: string) => {
        const key = `${roomId}_${userRole}`;
        return get().imagesByRoom[key] || {};
      },

      clearImagesForRoom: (roomId: string, userRole: string) => {
        const key = `${roomId}_${userRole}`;
        set((state) => {
          const newImagesByRoom = { ...state.imagesByRoom };
          delete newImagesByRoom[key];
          return { imagesByRoom: newImagesByRoom };
        });
      },

      clearAllImages: () => {
        set({ imagesByRoom: {} });
      },
    }),
    {
      name: "personality-images-storage",
      storage,
    }
  )
);
