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
    description: "Fictional inspiration",
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
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>(
    {}
  );
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");

  // Load current user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem(`room_${roomId}_user`);
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user.name || "You");
    }

    // Load saved images from localStorage
    const savedImages = localStorage.getItem(
      `room_${roomId}_images_${currentUser}`
    );
    if (savedImages) {
      setUploadedImages(JSON.parse(savedImages));
    }
  }, [roomId, currentUser]);

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        `room_${roomId}_images_${currentUser}`,
        JSON.stringify(uploadedImages)
      );
    }
  }, [uploadedImages, roomId, currentUser]);

  const handleFileUpload = (categoryId: string, file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => ({
          ...prev,
          [categoryId]: e.target?.result as string,
        }));
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

  const removeImage = (categoryId: string) => {
    setUploadedImages((prev) => {
      const newImages = { ...prev };
      delete newImages[categoryId];
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
      <div className="max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Room
          </Button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Room {roomId}
            </div>
            <div className="text-xs text-muted-foreground">
              Playing as: {currentUser}
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Partner Personality Gallery
          </h1>
          <p className="text-muted-foreground mb-4">
            Upload photos that represent your partner&apos;s unique personality
          </p>
          <div className="text-sm text-muted-foreground">
            {uploadedCount}/9 categories completed
          </div>
        </div>

        {!isReady ? (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categories.map((category) => {
                const Icon = category.icon;
                const hasImage = uploadedImages[category.id];
                const isDraggedOver = dragOver === category.id;

                return (
                  <Card
                    key={category.id}
                    className={`group transition-all duration-200 hover:shadow-md ${
                      hasImage
                        ? "border-foreground/20 bg-muted/50"
                        : isDraggedOver
                        ? "border-foreground/40 bg-muted"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-md bg-muted">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
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
                          <div className="relative aspect-square">
                            <Image
                              src={
                                uploadedImages[category.id] ||
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
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-square cursor-pointer p-4">
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
              className="bg-foreground h-3 rounded-full transition-all duration-300"
              style={{ width: `${(uploadedCount / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
