import { useState, useEffect } from "react";
import { predefinedImages } from "@/lib/personality-form-constants";
import type { UploadedImages } from "@/lib/personality-form-constants";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";

interface UsePersonalityFormProps {
  roomId: string;
}

export function usePersonalityForm({ roomId }: UsePersonalityFormProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [userSlot, setUserSlot] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Zustand store for images
  const { getImagesForRoom, setImagesForRoom, clearImagesForRoom } =
    usePersonalityImagesStore();

  // Get images from store based on current room and user slot
  const uploadedImages = userSlot ? getImagesForRoom(roomId, userSlot) : {};

  // Helper function to update images in store
  const updateUploadedImages = (
    updater: (prev: UploadedImages) => UploadedImages
  ) => {
    if (!userSlot) return;
    const currentImages = getImagesForRoom(roomId, userSlot);
    const newImages = updater(currentImages);
    setImagesForRoom(roomId, userSlot, newImages);
  };

  // Load current user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user.name || "You");
      setUserSlot((user.slot || "").toLowerCase());
    }
  }, [roomId]);

  // Helper function to update progress in backend
  const updateCategoryProgress = async (
    categoryId: string,
    hasData: boolean
  ) => {
    if (!userSlot) return;

    try {
      await fetch(`/api/room/${roomId}/update-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: categoryId,
          hasData,
          userSlot,
        }),
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
      // Non-blocking error - continue with local state
    }
  };

  const handleFileUpload = (categoryId: string, file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageUrl = e.target?.result as string;

        updateUploadedImages((prev) => {
          let newState;
          let shouldUpdateProgress = false;

          if (categoryId === "character") {
            // For character category, support up to 5 images
            const currentImages = (prev[categoryId] as string[]) || [];
            if (currentImages.length < 5) {
              newState = {
                ...prev,
                [categoryId]: [...currentImages, newImageUrl],
              };
              // Update progress if this is the first image for character category
              shouldUpdateProgress = currentImages.length === 0;
            } else {
              newState = prev; // Don't add if already 5 images
            }
          } else {
            // For other categories, single image
            newState = {
              ...prev,
              [categoryId]: newImageUrl,
            };
            // Update progress if this category didn't have an image before
            shouldUpdateProgress = !prev[categoryId];
          }

          // Update backend progress if needed
          if (shouldUpdateProgress) {
            updateCategoryProgress(categoryId, true);
          }

          return newState;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOver(null);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileUpload(categoryId, files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOver(categoryId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handlePaste = async (e: React.ClipboardEvent, categoryId: string) => {
    e.preventDefault();

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            const blob = await clipboardItem.getType(type);
            const file = new File(
              [blob],
              `pasted-image.${type.split("/")[1]}`,
              { type }
            );
            handleFileUpload(categoryId, file);
            return;
          }
        }
      }

      // Fallback: check clipboard data from the event
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              handleFileUpload(categoryId, file);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.log("Paste not supported or no image in clipboard");
    }
  };

  const removeImage = (categoryId: string, imageIndex?: number) => {
    updateUploadedImages((prev) => {
      const newImages = { ...prev };
      let shouldUpdateProgress = false;

      if (categoryId === "character" && typeof imageIndex === "number") {
        // For character category, remove specific image by index
        const currentImages = (prev[categoryId] as string[]) || [];
        const updatedImages = currentImages.filter(
          (_, index) => index !== imageIndex
        );
        if (updatedImages.length === 0) {
          delete newImages[categoryId];
          shouldUpdateProgress = true; // Category became empty
        } else {
          newImages[categoryId] = updatedImages;
        }
      } else {
        // For other categories, remove the single image
        if (prev[categoryId]) {
          shouldUpdateProgress = true; // Category had image and now will be empty
        }
        delete newImages[categoryId];
      }

      // Update backend progress if category became empty
      if (shouldUpdateProgress) {
        updateCategoryProgress(categoryId, false);
      }

      return newImages;
    });
  };

  const handleReady = async () => {
    // [not needed anymore]
    // localStorage.setItem(`room_${roomId}_ready_${currentUser}`, "true");
    setIsReady(true);

    // Images are already saved in Zustand store with persistence
    // No need for manual sessionStorage saving

    // Update ready state in backend
    try {
      await fetch(`/api/room/${roomId}/update-ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userSlot,
          isReady: true,
        }),
      });
    } catch (error) {
      console.error("Failed to update ready state:", error);
      // Non-blocking error - continue with local state
    }
  };

  const fillWithPredefinedImages = () => {
    if (!userSlot) return;
    setImagesForRoom(roomId, userSlot, predefinedImages);

    // Update progress for all categories
    Object.keys(predefinedImages).forEach((categoryId) => {
      updateCategoryProgress(categoryId, true);
    });
  };

  const clearAllImages = () => {
    if (!userSlot) return;
    clearImagesForRoom(roomId, userSlot);
  };

  const uploadedCount = Object.keys(uploadedImages).length;
  const isComplete = uploadedCount === 9;

  return {
    // State
    uploadedImages,
    dragOver,
    focusedCard,
    isReady,
    currentUser,
    userSlot,
    drawerOpen,
    uploadedCount,
    isComplete,

    // State setters
    setDragOver,
    setFocusedCard,
    setIsReady,
    setDrawerOpen,

    // Actions
    handleFileUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handlePaste,
    removeImage,
    handleReady,
    fillWithPredefinedImages,
    clearAllImages,
  };
}
