"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";
import { CategoryMarquee } from "./personality-form/category-marquee";
import CategoryHoverReveal from "./personality-form/category-hover-reveal";
import CategoryExpandableGallery from "./personality-form/category-expandable-gallery";
import { useRouter } from "next/navigation";
import {
  enviroment,
  USE_LAMBDA_UPLOAD,
  LAMBDA_UPLOAD_ENDPOINT,
} from "@/lib/env";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface RevealContentProps {
  roomId: string;
}

interface RevealState {
  stage: "loading" | "uploading" | "ready" | "error";
  progress: number;
  message: string;
  currentStep: string;
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
  imagesDownloaded: boolean;
}

const LOADING_MESSAGES = [
  "Gathering your personality galleries...",
  "Preparing the magic swap...",
  "Uploading images to secure storage...",
  "Almost ready for the big reveal...",
  "Finalizing the personality exchange...",
];

const UPLOADING_STEPS = [
  "Compressing images for optimal quality...",
  "Uploading to secure cloud storage...",
  "Processing personality categories...",
  "Preparing swap visualization...",
  "Making everything beautiful...",
];

export default function RevealContent({ roomId }: RevealContentProps) {
  const { getImagesForRoom } = usePersonalityImagesStore();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [revealState, setRevealState] = useState<RevealState>({
    stage: "loading",
    progress: 0,
    message: LOADING_MESSAGES[0],
    currentStep: "Initializing...",
  });

  const [userRole, setUserRole] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<any>({});
  const [partnerImages, setPartnerImages] = useState<PartnerImagesState>({
    isReady: false,
    loading: false,
    error: null,
    images: {},
    cachedImages: {},
    partnerRole: "",
    totalImages: 0,
    categoriesCompleted: 0,
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

  // Get user data and images from Zustand store
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");

    if (userData) {
      const user = JSON.parse(userData);
      const role = user.role || "girlfriend";
      setUserRole(role);

      // Get uploaded images from Zustand store
      const images = getImagesForRoom(roomId, role);

      if (Object.keys(images).length > 0) {
        setUploadedImages(images);
      } else {
        console.warn("No images found in Zustand store for reveal");
      }
    } else {
      console.warn("No user data found in localStorage for reveal");
      // redirect to home
      router.push("/");
    }
  }, [roomId, getImagesForRoom]);

  // Real upload and processing stages
  useEffect(() => {
    if (!userRole || Object.keys(uploadedImages).length === 0) return;

    let currentMessageIndex = 0;
    let hasStartedUploading = false;

    // Initial loading phase
    const loadingInterval = setInterval(() => {
      setRevealState((prev) => {
        const newProgress = Math.min(prev.progress + 5, 25);

        let newMessage = prev.message;
        if (
          newProgress % 10 === 0 &&
          currentMessageIndex < LOADING_MESSAGES.length - 1
        ) {
          currentMessageIndex++;
          newMessage = LOADING_MESSAGES[currentMessageIndex];
        }

        if (newProgress >= 25) {
          clearInterval(loadingInterval);

          // Start the actual upload process
          if (!hasStartedUploading) {
            hasStartedUploading = true;
            startImageUpload();
          }
        }

        return {
          ...prev,
          progress: newProgress,
          message: newMessage,
        };
      });
    }, 300);

    return () => clearInterval(loadingInterval);
  }, [userRole, uploadedImages]);

  // Check partner images when ready state is reached
  useEffect(() => {
    if (revealState.stage === "ready" && userRole && !showReveal) {
      checkPartnerImages();
    }
  }, [revealState.stage, userRole, showReveal]);

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

  const checkPartnerImages = async () => {
    if (!userRole) return;

    setPartnerImages((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/room/${roomId}/partner-images?userRole=${userRole}`
      );
      const data = await response.json();

      if (data.success) {
        setPartnerImages({
          isReady: data.isReady,
          loading: false,
          error: null,
          images: data.images,
          cachedImages: {},
          partnerRole: data.partnerRole,
          totalImages: data.totalImages,
          categoriesCompleted: data.categoriesCompleted,
          imagesDownloaded: false,
        });
      } else {
        setPartnerImages((prev) => ({
          ...prev,
          loading: false,
          error: data.error || "Failed to check partner images",
        }));
      }
    } catch (error) {
      console.error("Error checking partner images:", error);
      setPartnerImages((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to connect to server",
      }));
    }
  };

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

  const handleRevealImages = async () => {
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

        setShowReveal(true);
      } catch (error) {
        console.error("Error downloading images:", error);
        // Fallback to showing original URLs
        setPartnerImages((prev) => ({
          ...prev,
          cachedImages: prev.images,
          imagesDownloaded: true,
          loading: false,
        }));
        setShowReveal(true);
      }
    } else {
      setShowReveal(true);
    }
  };

  // Helper function to handle upload to either original route or Lambda
  const uploadImages = async (
    roomId: string,
    userRole: string,
    images: any
  ) => {
    if (USE_LAMBDA_UPLOAD && LAMBDA_UPLOAD_ENDPOINT) {
      const response = await fetch(LAMBDA_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          userRole,
          images,
        }),
      });

      return await response.json();
    } else {
      const response = await fetch(`/api/room/${roomId}/upload-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRole,
          images,
        }),
      });

      return await response.json();
    }
  };

  // Function to start the image upload process
  const startImageUpload = async () => {
    try {
      // Update to uploading stage
      setRevealState((prev) => ({
        ...prev,
        stage: "uploading",
        progress: 25,
        message: "Processing your personality swap...",
        currentStep: UPLOADING_STEPS[0],
      }));

      // Simulate upload progress with steps
      let currentStepIndex = 0;
      const uploadProgressInterval = setInterval(() => {
        setRevealState((prev) => {
          const newProgress = Math.min(prev.progress + 8, 85);

          if (
            newProgress % 12 === 0 &&
            currentStepIndex < UPLOADING_STEPS.length - 1
          ) {
            currentStepIndex++;
          }

          return {
            ...prev,
            progress: newProgress,
            currentStep: UPLOADING_STEPS[currentStepIndex],
          };
        });
      }, 400);

      const result = await uploadImages(roomId, userRole, uploadedImages);

      // Clear the progress interval
      clearInterval(uploadProgressInterval);

      if (result.success) {
        // Complete the upload and move to ready state
        setRevealState({
          stage: "ready",
          progress: 100,
          message: "Your personality reveal is ready!",
          currentStep: "Complete! 🎉",
        });
      } else {
        setRevealState((prev) => ({
          ...prev,
          stage: "error",
          message: "Upload failed",
        }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setRevealState((prev) => ({
        ...prev,
        stage: "error",
        message: "Failed to connect to server",
      }));
    }
  };

  if (revealState.stage === "error") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 border border-red-200 dark:border-red-800">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold font-mono text-red-800 dark:text-red-200 mb-4">
            Something went wrong
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6">
            We encountered an issue preparing your reveal. Please try again.
          </p>
          <Button asChild variant="outline">
            <Link href={`/room/${roomId}`}>Back to Room</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (revealState.stage !== "ready") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-bold font-mono mb-4">
            Preparing Your Reveal
          </h1>
          <p className="text-lg text-muted-foreground">{revealState.message}</p>
        </div>

        {/* Progress Section */}
        <div className="bg-card/60 rounded-xl p-8 border shadow-lg">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(revealState.progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${revealState.progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-200 border-t-purple-600"></div>
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {revealState.currentStep}
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              This may take a few moments while we process your images...
            </div>
          </div>
        </div>

        {/* Calming Message */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-xl">💫</div>
              <div className="text-left">
                <h3 className="font-medium font-mono text-blue-800 dark:text-blue-200">
                  Almost there!
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  We're creating a beautiful way for you both to see how you
                  perceive each other. The wait will be worth it!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show the actual reveal
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

      {/* Partner Images Status */}
      {!showReveal && (
        <div className="bg-card/60 rounded-xl p-8 border shadow-lg text-center mb-8">
          <div className="text-4xl mb-4">🔮</div>
          <h2 className="text-2xl font-semibold font-mono mb-4">
            Checking Partner's Images...
          </h2>

          {partnerImages.loading && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading partner's gallery...</span>
            </div>
          )}

          {partnerImages.error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 mb-6">
              <p className="text-red-700 dark:text-red-300">
                {partnerImages.error}
              </p>
              <Button
                onClick={checkPartnerImages}
                variant="outline"
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {!partnerImages.loading &&
            !partnerImages.error &&
            partnerImages.isReady && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="text-xl font-semibold font-mono text-green-800 dark:text-green-200 mb-2">
                    Partner's Images Ready!
                  </h3>
                  <p className="text-green-600 dark:text-green-400 mb-4">
                    Your {partnerImages.partnerRole} has uploaded{" "}
                    {partnerImages.totalImages} images across{" "}
                    {partnerImages.categoriesCompleted} categories
                  </p>
                  <Button
                    onClick={handleRevealImages}
                    variant="shadow"
                    size="lg"
                    disabled={partnerImages.loading}
                  >
                    {partnerImages.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Downloading Images...
                      </>
                    ) : (
                      "🎭 Reveal Their Vision of You"
                    )}
                  </Button>
                </div>
              </div>
            )}

          {!partnerImages.loading &&
            !partnerImages.error &&
            !partnerImages.isReady && (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                  <div className="text-4xl mb-3">⏳</div>
                  <h3 className="text-xl font-semibold font-mono text-amber-800 dark:text-amber-200 mb-2">
                    {partnerImages.categoriesCompleted >= 8
                      ? "Almost Ready!"
                      : "Partner Still Uploading..."}
                  </h3>
                  <p className="text-amber-600 dark:text-amber-400 mb-4">
                    Your {partnerImages.partnerRole} has completed{" "}
                    {partnerImages.categoriesCompleted}/9 categories
                    {partnerImages.totalImages > 0 && (
                      <span className="block text-sm mt-1">
                        ({partnerImages.totalImages} images uploaded)
                      </span>
                    )}
                  </p>

                  {partnerImages.categoriesCompleted >= 8 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-blue-500 text-lg">💡</div>
                        <div className="text-left">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                            Almost there!
                          </h4>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Your partner has uploaded most of their images. They
                            might be finishing up the last category, or there
                            might be a validation issue. Try checking again.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={checkPartnerImages}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {partnerImages.categoriesCompleted >= 8
                      ? "Check If Ready"
                      : "Check Again"}
                  </Button>
                </div>

                {/* Debug info for development */}
                {process.env.NODE_ENV === "development" && (
                  <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-2">
                      Debug Info:
                    </h4>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Categories: {partnerImages.categoriesCompleted}/9</p>
                      <p>Total Images: {partnerImages.totalImages}</p>
                      <p>Is Ready: {partnerImages.isReady ? "Yes" : "No"}</p>
                      <p>Partner Role: {partnerImages.partnerRole}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Show Reveal */}
      {showReveal && partnerImages.isReady && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-mono mb-4 text-gradient">
              How Your{" "}
              {partnerImages.partnerRole === "girlfriend"
                ? "Girlfriend"
                : "Boyfriend"}{" "}
              Sees You
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              These are the images they chose to represent your personality
            </p>

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

          {enviroment === "development" && (
            <div className="text-center">
              <Button onClick={() => setShowReveal(false)} variant="outline">
                Check Status Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
