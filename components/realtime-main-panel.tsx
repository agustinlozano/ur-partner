"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";

import { Upload, CheckCircle, MousePointer, RefreshCcw } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnsplashIcon } from "./icons";

import { useGameStore } from "@/stores/realtime-store";
import { pickUnsplashImage } from "@/stores/unsplash-image-selector-store";
import type { UnsplashPhoto } from "@/components/unsplash-image-selector";
import type { UploadedImages } from "@/lib/personality-form-constants";
import { compressImageToBase64, CompressResult } from "./realtime.compress";
import "./realtime.css";

type MainPanelProps = {
  userSlot: "a" | "b";
  me: { name: string; avatar: string };
  connected: boolean;
  selectedCategory: string | null;
  isReady: boolean;
  ping?: number;
  onImageUpload: (file: File, thumbnail?: CompressResult) => void;
  onCategoryDrop: (category: string) => void;
  roomId?: string;
  uploadedImages?: UploadedImages;
  onRemoveImage?: (category: string) => void; // use a better type if `personality-images-store` has a specific type for this
};

export function MainPanel({
  userSlot,
  connected,
  me,
  selectedCategory,
  isReady,
  ping,
  onImageUpload,
  onCategoryDrop,
  roomId,
  uploadedImages = {},
  onRemoveImage,
}: MainPanelProps) {
  const handleRemoveImage = (category: string) => {
    if (onRemoveImage) {
      onRemoveImage(category);
    }
  };
  const reconnectSocket = useGameStore((s) => s.reconnectSocket);
  const reconnecting = useGameStore((s) => s.reconnecting);
  const [dragOver, setDragOver] = useState(false);
  const [categoryDragOver, setCategoryDragOver] = useState(false);

  // Animation state for ping
  const [shake, setShake] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (ping) {
      setShake(true);
      setPulse(true);
      const shakeTimeout = setTimeout(() => setShake(false), 400); // short shake
      const pulseTimeout = setTimeout(() => setPulse(false), 700); // match PartnerTracker badge
      toast.success("Ping received from your partner", {
        duration: 2000,
        icon: "🔔",
      });
      return () => {
        clearTimeout(shakeTimeout);
        clearTimeout(pulseTimeout);
      };
    }
  }, [ping]);

  const [firstName] = me.name.split(" ");
  const shortName =
    firstName.length > 10 ? firstName.slice(0, 10) + "..." : firstName;

  const [compressing, setCompressing] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      setCategoryDragOver(false);

      // Check if it's a category being dragged
      const categoryData = e.dataTransfer.getData("text/plain");
      if (categoryData && !categoryData.includes("/")) {
        // It's a category ID
        onCategoryDrop(categoryData);
        return;
      }

      // Handle file drop
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        await handleImageFile(imageFile);
      }
    },
    [onImageUpload, onCategoryDrop]
  );

  const handleImageFile = async (file: File) => {
    // Check file size limit (20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      toast.error(
        `File too large. Maximum size is 20MB. Your file is ${formatBytes(
          file.size
        )}.`,
        {
          duration: 5000,
          icon: "🚨",
        }
      );
      return;
    }

    // Always compress images for optimal performance
    try {
      setCompressing(true);
      await handleCompressAndUpload(file);
    } catch (error) {
      toast.error("Failed to process image");
      setCompressing(false);
    }
  };

  const handleCompressAndUpload = async (file: File) => {
    if (!file) return;

    try {
      setCompressing(true);

      // Compression for storage (onImageUpload)
      const storageCompressionOptions = {
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 0.75,
        format: "jpeg" as const,
      };

      // Compression for thumbnail display
      const thumbnailCompressionOptions = {
        maxWidth: 120,
        maxHeight: 120,
        quality: 0.5,
        format: "jpeg" as const,
      };

      // Compress for storage
      const storageResult = await compressImageToBase64(
        file,
        storageCompressionOptions
      );

      // Compress for thumbnail
      const thumbnailResult = await compressImageToBase64(
        file,
        thumbnailCompressionOptions
      );

      // Convert storage base64 back to file for upload
      const compressedFile = base64ToFile(
        storageResult.base64,
        `compressed-${file.name}`
      );

      toast.success(
        `Image optimized: ${
          storageResult.compressionRatio
        }% smaller (${formatBytes(storageResult.compressedSize)})`
      );

      // Upload the storage-quality compressed file
      onImageUpload(compressedFile, thumbnailResult);
    } catch (error) {
      console.error("Compression failed:", error);
      toast.error("Image optimization failed. Uploading original...");
      // Fallback to original file if compression fails
      onImageUpload(file);
    } finally {
      setCompressing(false);
    }
  };

  // Improved drag detection: if there are files, it's an image drag; otherwise, treat as category drag
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    const hasFiles = items.some((item) => item.kind === "file");
    if (hasFiles) {
      setDragOver(true);
      setCategoryDragOver(false);
    } else {
      setCategoryDragOver(true);
      setDragOver(false);
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    const hasFiles = items.some((item) => item.kind === "file");
    if (hasFiles) {
      setDragOver(true);
      setCategoryDragOver(false);
    } else {
      setCategoryDragOver(true);
      setDragOver(false);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
      setCategoryDragOver(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleImageFile(file);
      }
    },
    [onImageUpload]
  );

  const isDragActive = dragOver || categoryDragOver;
  const [unsplashLoading, setUnsplashLoading] = useState(false);

  const handlePickUnsplash = async () => {
    if (!selectedCategory || unsplashLoading) return;
    try {
      setUnsplashLoading(true);
      const photo = await pickUnsplashImage();
      if (!photo) return;
      const file = await unsplashPhotoToFile(photo);

      // Compress Unsplash images too
      await handleCompressAndUpload(file);
      toast.success("Unsplash image optimized and added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to use Unsplash image");
    } finally {
      setUnsplashLoading(false);
    }
  };

  return (
    <Card
      className={`p-3 sm:p-6 flex-1 bg-card/50 backdrop-blur-sm transition-all duration-300
        ${shake ? "mainpanel-shake-animation" : ""}
        ${pulse ? "mainpanel-pulse-animation" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className="font-medium font-mono">
              {me.avatar} {shortName}
            </span>
          </div>
          {selectedCategory ? (
            <Badge
              variant="secondary"
              className="text-xs px-3 border border-emerald-800 bg-emerald-600/20"
            >
              {selectedCategory}
            </Badge>
          ) : (
            <Badge variant="outline">no category</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {!connected && roomId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reconnectSocket(roomId, userSlot);
              }}
              className="gap-2"
              disabled={reconnecting}
            >
              <RefreshCcw
                className={`h-4 w-4 ${reconnecting ? "animate-spin" : ""}`}
              />
              {reconnecting ? "Reconnecting..." : "Reconnect"}
            </Button>
          )}
          {isReady && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready!</span>
            </div>
          )}
        </div>
      </div>

      {/* Completed images preview */}
      {Object.keys(uploadedImages).length > 0 && (
        <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completed {Object.keys(uploadedImages).length}/9
              </span>
            </div>
            <div className="flex-1 mx-4 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent"></div>
          </div>
          <div className="grid w-fit grid-cols-3 gap-2 py-2">
            {Object.entries(uploadedImages).map(
              ([category, imageUrl], index) => {
                console.log(
                  "🖼️ Rendering image for uploadedImages:",
                  uploadedImages
                );
                const urlString = Array.isArray(imageUrl)
                  ? imageUrl[0]
                  : imageUrl;
                console.log(
                  "🖼️ Rendering image for category:",
                  category,
                  "URL type:",
                  urlString.startsWith("data:") ? "base64" : "other"
                );
                return (
                  <div
                    key={category}
                    className="group relative w-fit flex-shrink-0 animate-in fade-in-0 zoom-in-95 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/50 bg-muted/30 shadow-sm hover:shadow-md transition-all duration-200">
                      <Image
                        src={urlString}
                        alt={category}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    {/* Completed badge + delete button on hover */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background shadow-sm flex items-center justify-center">
                      <div className="absolute inset-0.5 bg-emerald-400 rounded-full animate-ping opacity-30"></div>
                      {/* Red cross button, visible on hover */}
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        style={{ pointerEvents: "auto" }}
                        aria-label={`Delete the image for ${category} category`}
                        onClick={() => handleRemoveImage(category)}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="6" cy="6" r="6" fill="#ef4444" />
                          <path
                            d="M4 4l4 4M8 4l-4 4"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* UI description: Drop zone for categories and images */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all select-none
          ${
            categoryDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : dragOver
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
              : "border-muted-foreground/25"
          }
          ${isDragActive ? "scale-[1.02]" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {compressing && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Optimizing image...
              </span>
            </div>
          </div>
        )}
        {categoryDragOver ? (
          <div className="space-y-4 h-44 flex flex-col items-center justify-center">
            <MousePointer className="h-12 w-12 mx-auto text-blue-500" />
            <div>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                Drop category here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Release to select this category
              </p>
            </div>
          </div>
        ) : selectedCategory ? (
          <div className="space-y-4 h-44 flex flex-col items-center justify-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">
                Drop image or click to upload
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload an image for the &quot;{selectedCategory}&quot; category
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                size="sm"
                asChild
                disabled={unsplashLoading || compressing}
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  {compressing ? "Processing..." : "Choose File"}
                </label>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickUnsplash}
                disabled={unsplashLoading || compressing}
                className="gap-2"
              >
                {unsplashLoading ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : null}
                {unsplashLoading ? (
                  "Fetching..."
                ) : (
                  <>
                    <UnsplashIcon /> Pick from Unsplash
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 h-44 flex flex-col items-center justify-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <MousePointer className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                Drop a category here
              </p>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                Drag a category from the left panel or click on one to select
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

async function unsplashPhotoToFile(photo: UnsplashPhoto): Promise<File> {
  const url = photo.urls.regular || photo.urls.small || photo.urls.thumb;
  const res = await fetch(url);
  console.log("Fetched Unsplash image:", res);
  if (!res.ok) throw new Error("Failed to download Unsplash image");
  const blob = await res.blob();
  const ext = blob.type.includes("png") ? "png" : "jpg";
  return new File([blob], `unsplash-${photo.id}.${ext}`, { type: blob.type });
}

/**
 * Convert base64 string to File object
 */
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
