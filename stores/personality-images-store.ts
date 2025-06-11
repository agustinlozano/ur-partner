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

// TODO: try to understand how this works
// Utility functions for storage management
const getStorageSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

const getAvailableSpace = (): number => {
  if (typeof window === "undefined") return 0;

  // Estimate available space (sessionStorage typically has 5-10MB limit)
  try {
    const testKey = "storage-test";
    const testData = new Array(1024).join("a"); // 1KB test string
    let size = 0;

    // Try to store increasingly larger amounts to find limit
    for (let i = 0; i < 10000; i++) {
      try {
        sessionStorage.setItem(testKey, testData.repeat(i));
        size = i * 1024; // Size in bytes
      } catch {
        sessionStorage.removeItem(testKey);
        return size * 0.8; // Return 80% of detected limit for safety
      }
    }

    sessionStorage.removeItem(testKey);
    return 5 * 1024 * 1024; // Default to 5MB if detection fails
  } catch {
    return 5 * 1024 * 1024; // Default fallback
  }
};

const compressImage = (
  base64: string,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(base64);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    img.onerror = () => resolve(base64); // Fallback to original
    img.src = base64;
  });
};

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

  setItem: async (name: string, value: any) => {
    try {
      const serialized = JSON.stringify(value);
      const dataSize = getStorageSize(value);
      const availableSpace = getAvailableSpace();

      // Check if data exceeds available space
      if (dataSize > availableSpace) {
        console.warn(
          `Data size (${Math.round(
            dataSize / 1024
          )}KB) exceeds available space (${Math.round(
            availableSpace / 1024
          )}KB)`
        );

        // Try to compress images if the value contains base64 images
        if (value.imagesByRoom) {
          const compressedValue = { ...value };

          for (const [roomKey, images] of Object.entries(value.imagesByRoom)) {
            const compressedImages: UploadedImages = {};

            for (const [category, imageData] of Object.entries(
              images as UploadedImages
            )) {
              if (Array.isArray(imageData)) {
                // Handle character category (array of images)
                compressedImages[category] = await Promise.all(
                  imageData.map((img) =>
                    typeof img === "string" && img.startsWith("data:")
                      ? compressImage(img, 0.6)
                      : img
                  )
                );
              } else if (
                typeof imageData === "string" &&
                imageData.startsWith("data:")
              ) {
                // Handle single image categories
                compressedImages[category] = await compressImage(
                  imageData,
                  0.6
                );
              } else {
                compressedImages[category] = imageData;
              }
            }

            compressedValue.imagesByRoom[roomKey] = compressedImages;
          }

          // Try again with compressed data
          const compressedSerialized = JSON.stringify(compressedValue);
          const compressedSize = getStorageSize(compressedValue);

          if (compressedSize < availableSpace) {
            sessionStorage.setItem(name, compressedSerialized);
            console.info(
              `Successfully compressed data from ${Math.round(
                dataSize / 1024
              )}KB to ${Math.round(compressedSize / 1024)}KB`
            );
            return;
          }
        }

        // If compression didn't help enough, clear old data
        const oldestKeys = Object.keys(sessionStorage).filter((key) =>
          key.startsWith("personality-images-storage")
        );

        if (oldestKeys.length > 1) {
          // Remove oldest entries (except current one)
          oldestKeys
            .slice(0, -1)
            .forEach((key) => sessionStorage.removeItem(key));
          console.info("Cleared old storage entries to make space");
        }
      }

      sessionStorage.setItem(name, serialized);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error("Storage quota exceeded. Clearing old data...");

        // Emergency cleanup - remove all personality storage except current session
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
          // Could implement additional fallback strategies here
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
// TODO: end

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
