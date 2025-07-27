"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { useGameStore } from "@/stores/realtime-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, MousePointer, RefreshCcw } from "lucide-react";

type MainPanelProps = {
  userSlot: "a" | "b";
  me: { name: string; avatar: string };
  connected: boolean;
  selectedCategory: string | null;
  progress: number;
  isReady: boolean;
  onImageUpload: (file: File) => void;
  onCategoryDrop: (category: string) => void;
  roomId?: string; // opcional, para reconectar
};

export function MainPanel({
  userSlot,
  connected,
  me,
  selectedCategory,
  progress,
  isReady,
  onImageUpload,
  onCategoryDrop,
  roomId,
}: MainPanelProps) {
  const reconnectSocket = useGameStore((s) => s.reconnectSocket);
  const [dragOver, setDragOver] = useState(false);
  const [categoryDragOver, setCategoryDragOver] = useState(false);

  const [firstName] = me.name.split(" ");
  const shortName =
    firstName.length > 10 ? firstName.slice(0, 10) + "..." : firstName;

  const [showCompressLink, setShowCompressLink] = useState(false);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
        if (imageFile.size > 4 * 1024 * 1024) {
          setShowCompressLink(true);
          return;
        }
        setShowCompressLink(false);
        onImageUpload(imageFile);
      }
    },
    [onImageUpload, onCategoryDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const categoryData = e.dataTransfer.getData("text/plain");

    if (categoryData && !categoryData.includes("/")) {
      setCategoryDragOver(true);
      setDragOver(false);
    } else {
      setDragOver(true);
      setCategoryDragOver(false);
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer.items);
    const hasFiles = items.some((item) => item.kind === "file");

    if (hasFiles) {
      setDragOver(true);
    } else {
      setCategoryDragOver(true);
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 4 * 1024 * 1024) {
          setShowCompressLink(true);
          return;
        }
        setShowCompressLink(false);
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const isDragActive = dragOver || categoryDragOver;

  return (
    <Card className="p-2 sm:p-6 flex-1 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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
            <Badge variant="secondary" className="capitalize">
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
                console.log("click", roomId, userSlot);
                reconnectSocket(roomId, userSlot);
              }}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Reconnect
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

      {progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all select-none ${
          categoryDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        } ${isDragActive ? "scale-[1.02]" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {showCompressLink && (
          <div className="mb-4">
            <a
              href="https://www.google.com/search?q=compress+images"
              target="_blank"
              rel="noopener noreferrer"
              className="text-destructive underline text-sm"
            >
              Image too large (over 4MB). Compress it here.
            </a>
          </div>
        )}
        {categoryDragOver ? (
          <div className="space-y-4">
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
          <div className="space-y-4">
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
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <MousePointer className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                Drop a category here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag a category from the left panel or click on one to select
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
