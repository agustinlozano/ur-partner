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
      // Use sessionStorage instead of localStorage for temporary storage
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
