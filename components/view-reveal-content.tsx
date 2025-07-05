"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { CategoryMarquee } from "./personality-form/category-marquee";
import CategoryHoverReveal from "./personality-form/category-hover-reveal";
import CategoryExpandableGallery from "./personality-form/category-expandable-gallery";
import { useRouter } from "next/navigation";
import { enviroment } from "@/lib/env";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { checkRevealReadyEnhanced } from "@/lib/check-reveal-ready";
import GradientBackground from "./gradient-background";

interface ViewRevealContentProps {
  roomId: string;
}

interface PartnerImagesState {
  isReady: boolean;
  loading: boolean;
  error: string | null;
  images: any;
  cachedImages: any;
  partnerRole: string;
  totalImages: number;
  categoriesCompleted: number;
  categoriesWithProgress: number;
  imagesDownloaded: boolean;
}

export default function ViewRevealContent({ roomId }: ViewRevealContentProps) {
  const isMobile = useIsMobile();

  const [userSlot, setUserSlot] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{
    role?: string;
    name?: string;
    slot?: string;
  } | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState<string>("");
  const [partnerImages, setPartnerImages] = useState<PartnerImagesState>({
    isReady: false,
    loading: true,
    error: null,
    images: {},
    cachedImages: {},
    partnerRole: "",
    totalImages: 0,
    categoriesCompleted: 0,
    categoriesWithProgress: 0,
    imagesDownloaded: false,
  });
  const [showReveal, setShowReveal] = useState(false);
  const [viewMode, setViewMode] = useState<"marquee" | "hover" | "gallery">(
    "gallery"
  );

  // Auto-switch to gallery if user is on mobile and tries to use hover
  useEffect(() => {
    if (isMobile && viewMode === "hover") {
      setViewMode("gallery");
    }
  }, [isMobile, viewMode]);

  // Check access and validate user
  useEffect(() => {
    async function validateAccess() {
      try {
        // Check if user data exists
        const userData = localStorage.getItem("activeRoom");

        if (!userData) {
          setAccessError("No user session found. Please join the room first.");
          setAccessDenied(true);
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);
        setUserSlot(user.slot || "");

        if (!user.slot) {
          setAccessError("Invalid user session. Please rejoin the room.");
          setAccessDenied(true);
          return;
        }

        // Check if reveal is ready using our enhanced function
        const revealStatus = await checkRevealReadyEnhanced(roomId, user.slot);

        if (revealStatus.error) {
          setAccessError(
            `Unable to verify reveal status: ${revealStatus.error}`
          );
          setAccessDenied(true);
          return;
        }

        if (!revealStatus.isReady) {
          const progressInfo = revealStatus.categoriesWithProgress
            ? `Your partner has ${revealStatus.categoriesWithProgress}/9 categories started and ${revealStatus.categoriesCompleted}/9 completed.`
            : `Your partner has ${revealStatus.categoriesCompleted}/9 categories ready.`;

          setAccessError(
            `Reveal not ready yet. ${progressInfo} Both partners must complete all 9 categories.`
          );
          setAccessDenied(true);
          return;
        }

        // If we get here, access is granted - load partner images
        setPartnerImages((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const result = await checkPartnerImagesAPI(roomId, user.slot);

        if (result.success && result.isReady) {
          setPartnerImages({
            isReady: true,
            loading: false,
            error: null,
            images: result.images || {},
            cachedImages: {},
            partnerRole: result.partnerRole || "",
            totalImages: result.totalImages || 0,
            categoriesCompleted: result.categoriesCompleted || 0,
            categoriesWithProgress: revealStatus.categoriesWithProgress || 0,
            imagesDownloaded: false,
          });
          setShowReveal(true);
        } else {
          setAccessError(
            "Partner images are not ready yet. Please try again later."
          );
          setAccessDenied(true);
        }
      } catch (error) {
        console.error("Error validating access:", error);
        setAccessError("Unable to verify access. Please try again.");
        setAccessDenied(true);
      }
    }

    validateAccess();
  }, [roomId]);

  // Function to download and cache images as blobs
  const downloadAndCacheImages = async (imageUrls: any) => {
    const cachedImages: any = {};

    try {
      // Process each category
      for (const [category, urls] of Object.entries(imageUrls)) {
        if (Array.isArray(urls)) {
          // Handle array of URLs (like character category)
          cachedImages[category] = [];
          for (const url of urls) {
            try {
              const response = await fetch(url as string);
              if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                cachedImages[category].push(blobUrl);
              } else {
                console.warn(`Failed to download image: ${url}`);
                cachedImages[category].push(url); // Fallback to original URL
              }
            } catch (error) {
              console.warn(`Error downloading image ${url}:`, error);
              cachedImages[category].push(url as string); // Fallback to original URL
            }
          }
        } else {
          // Handle single URL
          try {
            const response = await fetch(urls as string);
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              cachedImages[category] = blobUrl;
            } else {
              console.warn(`Failed to download image: ${urls}`);
              cachedImages[category] = urls; // Fallback to original URL
            }
          } catch (error) {
            console.warn(`Error downloading image ${urls}:`, error);
            cachedImages[category] = urls as string; // Fallback to original URL
          }
        }
      }

      return cachedImages;
    } catch (error) {
      console.error("Error caching images:", error);
      return imageUrls; // Return original URLs as fallback
    }
  };

  const handleCacheImages = async () => {
    if (!partnerImages.imagesDownloaded && partnerImages.images) {
      // Show loading state while downloading images
      setPartnerImages((prev) => ({ ...prev, loading: true }));

      try {
        const cachedImages = await downloadAndCacheImages(partnerImages.images);

        setPartnerImages((prev) => ({
          ...prev,
          cachedImages,
          imagesDownloaded: true,
          loading: false,
        }));
      } catch (error) {
        console.error("Error downloading images:", error);
        // Fallback to showing original URLs
        setPartnerImages((prev) => ({
          ...prev,
          cachedImages: prev.images,
          imagesDownloaded: true,
          loading: false,
        }));
      }
    }
  };

  // Auto-cache images when component loads
  useEffect(() => {
    if (
      showReveal &&
      partnerImages.isReady &&
      !partnerImages.imagesDownloaded
    ) {
      handleCacheImages();
    }
  }, [showReveal, partnerImages.isReady, partnerImages.imagesDownloaded]);

  // Cleanup blob URLs when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (partnerImages.cachedImages) {
        Object.values(partnerImages.cachedImages).forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((url) => {
              if (typeof url === "string" && url.startsWith("blob:")) {
                URL.revokeObjectURL(url);
              }
            });
          } else if (typeof value === "string" && value.startsWith("blob:")) {
            URL.revokeObjectURL(value);
          }
        });
      }
    };
  }, [partnerImages.cachedImages]);

  // Access Denied State
  if (accessDenied) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-card/60 rounded-xl shadow-lg p-8 border">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-primary/85 mb-6">
              {accessError || "You don't have permission to access this page."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}`}>
                <Button variant="default">Back to Room</Button>
              </Link>
              <Link href="/join">
                <Button variant="outline">Join Room</Button>
              </Link>
            </div>
          </div>
        </div>
      </GradientBackground>
    );
  }

  // Loading State
  if (partnerImages.loading && !showReveal) {
    return (
      <GradientBackground className="flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading reveal...</p>
        </div>
      </GradientBackground>
    );
  }

  // Main Reveal Content
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" asChild>
          <Link href={`/room/${roomId}`} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Room
          </Link>
        </Button>

        {enviroment === "development" && (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/room/${roomId}/reveal`}
              className="flex items-center gap-2"
            >
              🔧 Full Reveal Process
            </Link>
          </Button>
        )}
      </div>

      {/* Success Message */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold font-mono mb-4">The Big Reveal!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Here's how you and your partner see each other through personality
          images. The results might surprise you!
        </p>
      </div>

      {/* Show Reveal */}
      {showReveal && partnerImages.isReady && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-mono mb-4 text-gradient">
              How Your{" "}
              {partnerImages.partnerRole === "girlfriend"
                ? "Girlfriend"
                : partnerImages.partnerRole === "boyfriend"
                ? "Boyfriend"
                : "Partner"}{" "}
              Sees You
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              These are the images they chose to represent your personality
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
              <span>✨ {partnerImages.categoriesCompleted} categories</span>
              <span>🖼️ {partnerImages.totalImages} images</span>
              {partnerImages.categoriesWithProgress !==
                partnerImages.categoriesCompleted && (
                <span>🎯 {partnerImages.categoriesWithProgress} started</span>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-8 flex-wrap select-none">
              <Button
                onClick={() => setViewMode("gallery")}
                variant={viewMode === "gallery" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                🖼️ Gallery
              </Button>
              <Button
                onClick={() => setViewMode("marquee")}
                variant={viewMode === "marquee" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                🎠 Marquee
              </Button>
              {/* Only show hover option on non-mobile devices */}
              {!isMobile && (
                <Button
                  onClick={() => setViewMode("hover")}
                  variant={viewMode === "hover" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  🎯 Hover
                </Button>
              )}
            </div>
          </div>

          {/* Partner's Images - Different Views */}
          {viewMode === "marquee" && (
            <CategoryMarquee
              uploadedImages={
                partnerImages.imagesDownloaded
                  ? partnerImages.cachedImages
                  : partnerImages.images
              }
            />
          )}
          {viewMode === "hover" && (
            <CategoryHoverReveal
              uploadedImages={
                partnerImages.imagesDownloaded
                  ? partnerImages.cachedImages
                  : partnerImages.images
              }
            />
          )}
          {viewMode === "gallery" && (
            <CategoryExpandableGallery
              uploadedImages={
                partnerImages.imagesDownloaded
                  ? partnerImages.cachedImages
                  : partnerImages.images
              }
            />
          )}

          {/* Loading state for image caching */}
          {partnerImages.loading && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Optimizing images...</span>
              </div>
            </div>
          )}

          {enviroment === "development" && (
            <div className="text-center space-y-2">
              <Button
                onClick={() => setShowReveal(false)}
                variant="outline"
                size="sm"
              >
                Check Status Again
              </Button>
              <div className="text-xs text-muted-foreground">
                Dev: Categories {partnerImages.categoriesCompleted}/
                {partnerImages.categoriesWithProgress} | Images:{" "}
                {partnerImages.totalImages}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Reuse the API function from reveal-content.tsx
export async function checkPartnerImagesAPI(
  roomId: string,
  userSlot: string
): Promise<{
  success: boolean;
  isReady: boolean;
  images?: any;
  partnerRole?: string;
  totalImages?: number;
  categoriesCompleted?: number;
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/room/${roomId}/partner-images?userSlot=${userSlot}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        isReady: data.isReady,
        images: data.images,
        partnerRole: data.partnerRole,
        totalImages: data.totalImages,
        categoriesCompleted: data.categoriesCompleted,
      };
    } else {
      return {
        success: false,
        isReady: false,
        error: data.error || "Failed to check partner images",
      };
    }
  } catch (error) {
    console.error("Error checking partner images:", error);
    return {
      success: false,
      isReady: false,
      error: "Failed to connect to server",
    };
  }
}
