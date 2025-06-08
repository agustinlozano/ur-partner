"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Heart,
  MapPin,
  Leaf,
  User,
  Calendar,
  Gamepad2,
  UtensilsCrossed,
  Palette,
  Coffee,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import GradientBackground from "@/components/gradient-background";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const categories = [
  {
    id: "animal",
    name: "Animal",
    icon: Heart,
    description: "Their spirit animal",
  },
  {
    id: "place",
    name: "Place",
    icon: MapPin,
    description: "Dream destination",
  },
  { id: "plant", name: "Plant", icon: Leaf, description: "Favorite flora" },
  {
    id: "character",
    name: "Character",
    icon: User,
    description: "Fictional inspiration (up to 5)",
  },
  {
    id: "season",
    name: "Season",
    icon: Calendar,
    description: "Beloved time of year",
  },
  {
    id: "hobby",
    name: "Hobby",
    icon: Gamepad2,
    description: "Passionate pursuit",
  },
  {
    id: "food",
    name: "Food",
    icon: UtensilsCrossed,
    description: "Comfort cuisine",
  },
  {
    id: "colour",
    name: "Colour",
    icon: Palette,
    description: "Signature shade",
  },
  { id: "drink", name: "Drink", icon: Coffee, description: "Go-to beverage" },
];

interface PersonalityFormProps {
  roomId: string;
  onBack: () => void;
}

export default function PersonalityForm({
  roomId,
  onBack,
}: PersonalityFormProps) {
  const [uploadedImages, setUploadedImages] = useState<
    Record<string, string | string[]>
  >({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load current user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user.name || "You");
    }

    // Load saved images from localStorage
    // const savedImages = localStorage.getItem(
    //   `room_${roomId}_images_${currentUser}`
    // );
    // if (savedImages) {
    //   setUploadedImages(JSON.parse(savedImages));
    // }
  }, [roomId, currentUser]);

  // Save images to localStorage whenever they change
  // useEffect(() => {
  //   if (currentUser) {
  //     localStorage.setItem(
  //       `room_${roomId}_images_${currentUser}`,
  //       JSON.stringify(uploadedImages)
  //     );
  //   }
  // }, [uploadedImages, roomId, currentUser]);

  const handleFileUpload = (categoryId: string, file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageUrl = e.target?.result as string;

        setUploadedImages((prev) => {
          if (categoryId === "character") {
            // For character category, support up to 5 images
            const currentImages = (prev[categoryId] as string[]) || [];
            if (currentImages.length < 5) {
              return {
                ...prev,
                [categoryId]: [...currentImages, newImageUrl],
              };
            }
            return prev; // Don't add if already 5 images
          } else {
            // For other categories, single image
            return {
              ...prev,
              [categoryId]: newImageUrl,
            };
          }
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
    setUploadedImages((prev) => {
      const newImages = { ...prev };

      if (categoryId === "character" && typeof imageIndex === "number") {
        // For character category, remove specific image by index
        const currentImages = (prev[categoryId] as string[]) || [];
        const updatedImages = currentImages.filter(
          (_, index) => index !== imageIndex
        );
        if (updatedImages.length === 0) {
          delete newImages[categoryId];
        } else {
          newImages[categoryId] = updatedImages;
        }
      } else {
        // For other categories, remove the single image
        delete newImages[categoryId];
      }

      return newImages;
    });
  };

  const handleReady = () => {
    // Save ready state to localStorage
    localStorage.setItem(`room_${roomId}_ready_${currentUser}`, "true");
    setIsReady(true);
  };

  const uploadedCount = Object.keys(uploadedImages).length;
  const isComplete = uploadedCount === 9;

  return (
    <GradientBackground className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Room
          </Button>
          <div className="text-center absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="inline-flex items-center gap-2 sm:gap-4 bg-card/60 rounded-full px-3 sm:px-6 py-2 sm:py-3 border backdrop-blur-sm">
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono sm:text-sm font-medium text-foreground">
                  Room {roomId}
                </span>
              </div>
              <div className="hidden sm:block w-px h-3 sm:h-4 bg-border"></div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {currentUser?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground max-w-20 sm:max-w-none truncate">
                  {currentUser}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-mono font-semibold text-foreground mb-2">
            Partner Personality Gallery
          </h1>
          <p className="text-muted-foreground mb-4 text-pretty">
            Upload photos that represent your partner&apos;s unique personality
          </p>
        </div>

        {!isReady ? (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categories.map((category) => {
                const Icon = category.icon;
                const hasImage = uploadedImages[category.id];
                const isDraggedOver = dragOver === category.id;
                const isCharacterCategory = category.id === "character";
                const characterImages = isCharacterCategory
                  ? (uploadedImages[category.id] as string[]) || []
                  : [];
                const canAddMore = isCharacterCategory
                  ? characterImages.length < 5
                  : !hasImage;

                return (
                  <Card
                    key={category.id}
                    tabIndex={0}
                    className={`group transition-all duration-200 select-none hover:shadow-md focus:ring-2 focus:ring-foreground/20 focus:outline-none ${
                      hasImage
                        ? "border-foreground/20 bg-muted/50"
                        : isDraggedOver
                        ? "border-foreground/40 bg-muted"
                        : focusedCard === category.id
                        ? "border-foreground/30"
                        : "border-border hover:border-foreground/30"
                    }`}
                    onFocus={() => setFocusedCard(category.id)}
                    onBlur={() => setFocusedCard(null)}
                    onPaste={(e) => handlePaste(e, category.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-md bg-muted">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-mono font-medium text-foreground">
                            {category.name}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        {focusedCard === category.id && (
                          <div className="text-xs text-muted-foreground bg-foreground/10 px-2 py-1 rounded">
                            ⌘V to paste
                          </div>
                        )}
                      </div>

                      <div
                        className={`relative border border-dashed rounded-md transition-all duration-200 ${
                          isDraggedOver
                            ? "border-foreground/40 bg-muted/50"
                            : hasImage
                            ? "border-foreground/20"
                            : "border-border hover:border-foreground/30"
                        }`}
                        onDrop={(e) => handleDrop(e, category.id)}
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                      >
                        {hasImage ? (
                          isCharacterCategory ? (
                            // Multiple images for character category
                            <div className="grid grid-cols-2 gap-2 p-2">
                              {characterImages.map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative aspect-[4/3] sm:aspect-square"
                                >
                                  <Image
                                    src={imageUrl || "/placeholder.svg"}
                                    alt={`${category.name} image ${index + 1}`}
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() =>
                                      removeImage(category.id, index)
                                    }
                                  >
                                    <X className="w-2 h-2" />
                                  </Button>
                                </div>
                              ))}
                              {canAddMore && (
                                <label className="aspect-[4/3] sm:aspect-square border border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors">
                                  <div className="text-center">
                                    <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {characterImages.length}/5
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        handleFileUpload(category.id, file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          ) : (
                            // Single image for other categories
                            <div className="relative aspect-[4/3] sm:aspect-square">
                              <Image
                                src={
                                  (uploadedImages[category.id] as string) ||
                                  "/placeholder.svg"
                                }
                                alt={`${category.name} image`}
                                fill
                                className="object-cover rounded-md"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(category.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-[4/3] sm:aspect-square cursor-pointer p-4">
                            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">
                              Drop or click to upload
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(category.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleReady}
                disabled={!isComplete}
                variant={"shadow"}
              >
                {isComplete
                  ? "Ready! 🎉"
                  : `Upload All Images (${uploadedCount}/9)`}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setUploadedImages({})}
                disabled={uploadedCount === 0}
              >
                Clear All
              </Button>
            </div>

            {/* Completion Message */}
            {isComplete && (
              <div className="mt-8 text-center p-4 bg-muted rounded-md border">
                <h3 className="font-medium text-foreground mb-1">
                  Gallery Complete! 🎨
                </h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve captured all aspects of your partner&apos;s
                  personality. Click Ready when you&apos;re satisfied!
                </p>
              </div>
            )}
          </>
        ) : (
          /* Ready State */
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card/60 rounded-xl shadow-lg p-8 border">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold mb-4">
                You&apos;re Ready!
              </h2>
              <p className="text-muted-foreground mb-6">
                You&apos;ve completed your personality gallery with all 9
                categories. Now waiting for your partner to finish their gallery
                too.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="shadow">🔍 Track Partner Progress</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="font-mono">
                        Partner Progress Tracker
                      </DrawerTitle>
                      <DrawerDescription>
                        Real-time updates on your partner&apos;s gallery
                        completion
                      </DrawerDescription>
                    </DrawerHeader>
                    <PartnerTracker roomId={roomId} isOpen={drawerOpen} />
                  </DrawerContent>
                </Drawer>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => setIsReady(false)}>
                  Edit Gallery
                </Button>
                <Button variant="ghost" onClick={onBack}>
                  Back to Room
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 py-2 pb-4 bg-background/95 backdrop-blur-sm border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-end mb-2">
            <span className="text-xs text-muted-foreground">
              {uploadedCount}/9
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 border">
            <div
              className="bg-foreground h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 via-blue-600 to-blue-800"
              style={{ width: `${(uploadedCount / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}

// Partner Tracker Component
interface PartnerTrackerProps {
  roomId: string;
  isOpen: boolean;
}

function PartnerTracker({ roomId, isOpen }: PartnerTrackerProps) {
  const [partnerProgress, setPartnerProgress] = useState<{
    completed: string[];
    total: number;
    isReady: boolean;
    name?: string;
  }>({
    completed: [],
    total: 9,
    isReady: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Get user role from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || "girlfriend");
    }
  }, []);

  // Polling hook - only active when drawer is open
  useEffect(() => {
    if (!isOpen || !userRole) return;

    const pollPartnerStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/room/${roomId}/partner-status?role=${userRole}`
        );
        const data = await response.json();

        if (data.success) {
          setPartnerProgress(data.progress);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch partner status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    pollPartnerStatus();

    // Poll every 5 seconds (respecting Google Sheets limits: 300/min = 1 every 200ms, but we're being conservative)
    const interval = setInterval(pollPartnerStatus, 5000);

    return () => clearInterval(interval);
  }, [isOpen, roomId, userRole]);

  const progressPercentage = Math.round(
    (partnerProgress.completed.length / partnerProgress.total) * 100
  );

  return (
    <div className="p-6 space-y-6">
      {/* Partner Status Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-muted rounded-full px-4 py-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
            }`}
          />
          <span className="text-sm font-medium">
            {partnerProgress.name || "Your Partner"}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold font-mono mb-2">
            {progressPercentage}%
          </div>
          <div className="text-sm text-muted-foreground">
            {partnerProgress.completed.length} of {partnerProgress.total}{" "}
            categories completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Categories Progress */}
      <div className="space-y-3">
        <h3 className="font-medium text-center">Category Progress</h3>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isCompleted = partnerProgress.completed.includes(category.id);

            return (
              <div
                key={category.id}
                className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-muted/50 border-border"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mx-auto mb-2 ${
                    isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="text-xs font-medium truncate">
                  {category.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isCompleted ? "✅" : "⏳"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ready Status */}
      {partnerProgress.isReady && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-medium text-green-800 dark:text-green-200">
            Your partner is ready!
          </div>
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            Both galleries are complete. Get ready for the reveal!
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Checking partner progress...
          </div>
        </div>
      )}
    </div>
  );
}
