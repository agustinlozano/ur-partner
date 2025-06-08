"use client";

import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, ArrowLeft } from "lucide-react";
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
import { enviroment } from "@/lib/env";

// Import separated components and constants
import { usePersonalityForm } from "@/hooks/use-personality-form";
import { CategoryMarquee } from "@/components/personality-form/category-marquee";
import { PartnerTracker } from "@/components/personality-form/partner-tracker";
import {
  categories,
  type PersonalityFormProps,
} from "@/lib/personality-form-constants";

export default function PersonalityForm({
  roomId,
  onBack,
}: PersonalityFormProps) {
  const {
    // State
    uploadedImages,
    dragOver,
    focusedCard,
    isReady,
    currentUser,
    drawerOpen,
    uploadedCount,
    isComplete,

    // State setters
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
  } = usePersonalityForm({ roomId });

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
              {enviroment === "development" && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={fillWithPredefinedImages}
                  disabled={isComplete}
                >
                  ✨ Fill with Demo Images
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={clearAllImages}
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
          <div className="max-w-7xl mx-auto">
            {/* Celebration Header */}
            <div className="max-w-2xl mx-auto text-center mb-8">
              <div className="bg-card/60 rounded-xl shadow-lg p-8 border">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-semibold mb-4">
                  You&apos;re Ready!
                </h2>
                <p className="text-muted-foreground mb-6 text-pretty">
                  You&apos;ve completed your personality gallery with all 9
                  categories. Here&apos;s a beautiful review of your
                  partner&apos;s personality!
                </p>
              </div>
            </div>

            {/* Personality Gallery Marquee */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-center mb-6">
                Your Partner&apos;s Personality Gallery ✨
              </h3>
              <CategoryMarquee uploadedImages={uploadedImages} />
            </div>

            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 mt-10">
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
