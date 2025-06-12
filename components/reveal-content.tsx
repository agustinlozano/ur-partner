"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePersonalityImagesStore } from "@/stores/personality-images-store";
import { CategoryMarquee } from "./personality-form/category-marquee";
import { useRouter } from "next/navigation";

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
  partnerRole: string;
  totalImages: number;
  categoriesCompleted: number;
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
    partnerRole: "",
    totalImages: 0,
    categoriesCompleted: 0,
  });
  const [showReveal, setShowReveal] = useState(false);

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
    let currentStepIndex = 0;
    let hasStartedUploading = false;

    const progressInterval = setInterval(() => {
      setRevealState((prev) => {
        const newProgress = Math.min(prev.progress + 3, 100); // Slower for real processing

        // Update messages based on progress
        let newMessage = prev.message;
        let newStep = prev.currentStep;
        let newStage = prev.stage;

        if (newProgress < 25 && prev.stage === "loading") {
          // Loading stage - show loading messages
          if (
            newProgress % 10 === 0 &&
            currentMessageIndex < LOADING_MESSAGES.length - 1
          ) {
            currentMessageIndex++;
            newMessage = LOADING_MESSAGES[currentMessageIndex];
          }
        } else if (newProgress >= 25 && newProgress < 85) {
          // Uploading stage - start real upload process
          if (prev.stage === "loading") {
            newStage = "uploading";
            currentStepIndex = 0;

            // Start the actual upload process
            if (!hasStartedUploading) {
              hasStartedUploading = true;
              startImageUpload();
            }
          }

          if (
            newProgress % 8 === 0 &&
            currentStepIndex < UPLOADING_STEPS.length - 1
          ) {
            currentStepIndex++;
          }
          newStep = UPLOADING_STEPS[currentStepIndex];
          newMessage = "Processing your personality swap...";
        } else if (newProgress >= 85) {
          // Almost ready
          newStage = "ready";
          newMessage = "Your personality reveal is ready!";
          newStep = "Complete! 🎉";
        }

        if (newProgress >= 100) {
          clearInterval(progressInterval);
        }

        return {
          stage: newStage,
          progress: newProgress,
          message: newMessage,
          currentStep: newStep,
        };
      });
    }, 200); // Slower updates for real processing

    return () => clearInterval(progressInterval);
  }, [userRole, uploadedImages]);

  // Check partner images when ready state is reached
  useEffect(() => {
    if (revealState.stage === "ready" && userRole && !showReveal) {
      checkPartnerImages();
    }
  }, [revealState.stage, userRole, showReveal]);

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
          partnerRole: data.partnerRole,
          totalImages: data.totalImages,
          categoriesCompleted: data.categoriesCompleted,
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

  const handleRevealImages = () => {
    setShowReveal(true);
  };

  // Function to start the image upload process
  const startImageUpload = async () => {
    try {
      const response = await fetch(`/api/room/${roomId}/upload-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRole,
          images: uploadedImages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("Upload successful:", result.message);
        // Images are already persisted in Zustand store - no need to clear
      } else {
        console.error("Upload failed:", result.error);
        setRevealState((prev) => ({ ...prev, stage: "error" }));
      }
    } catch (error) {
      console.error("Upload error:", error);
      setRevealState((prev) => ({ ...prev, stage: "error" }));
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
                  >
                    🎭 Reveal Their Vision of You
                  </Button>
                </div>
              </div>
            )}

          {!partnerImages.loading &&
            !partnerImages.error &&
            !partnerImages.isReady && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                <div className="text-4xl mb-3">⏳</div>
                <h3 className="text-xl font-semibold font-mono text-amber-800 dark:text-amber-200 mb-2">
                  Partner Still Uploading...
                </h3>
                <p className="text-amber-600 dark:text-amber-400 mb-4">
                  Your {partnerImages.partnerRole} has completed{" "}
                  {partnerImages.categoriesCompleted}/9 categories
                </p>
                <Button onClick={checkPartnerImages} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Again
                </Button>
              </div>
            )}
        </div>
      )}

      {/* Show Reveal */}
      {showReveal && partnerImages.isReady && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-mono mb-4">
              How Your{" "}
              {partnerImages.partnerRole === "girlfriend"
                ? "Girlfriend"
                : "Boyfriend"}{" "}
              Sees You
            </h2>
            <p className="text-lg text-muted-foreground">
              These are the images they chose to represent your personality
            </p>
          </div>

          {/* Partner's Images Marquee */}
          <CategoryMarquee uploadedImages={partnerImages.images} />

          <div className="text-center">
            <Button onClick={() => setShowReveal(false)} variant="outline">
              Check Status Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
