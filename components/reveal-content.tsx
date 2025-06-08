"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RevealContentProps {
  roomId: string;
}

interface RevealState {
  stage: "loading" | "uploading" | "ready" | "error";
  progress: number;
  message: string;
  currentStep: string;
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
  const [revealState, setRevealState] = useState<RevealState>({
    stage: "loading",
    progress: 0,
    message: LOADING_MESSAGES[0],
    currentStep: "Initializing...",
  });

  const [userRole, setUserRole] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<any>({});

  // Get user data and images from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("activeRoom");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || "girlfriend");
    }

    // Get uploaded images from localStorage
    const imagesKey = `personality_images_${roomId}`;
    const savedImages = localStorage.getItem(imagesKey);
    if (savedImages) {
      setUploadedImages(JSON.parse(savedImages));
    }
  }, [roomId]);

  // Simulate the upload and processing stages
  useEffect(() => {
    if (!userRole) return;

    let currentMessageIndex = 0;
    let currentStepIndex = 0;

    const progressInterval = setInterval(() => {
      setRevealState((prev) => {
        const newProgress = Math.min(prev.progress + 5, 100);

        // Update messages based on progress
        let newMessage = prev.message;
        let newStep = prev.currentStep;
        let newStage = prev.stage;

        if (newProgress < 30 && prev.stage === "loading") {
          // Loading stage - show loading messages
          if (
            newProgress % 15 === 0 &&
            currentMessageIndex < LOADING_MESSAGES.length - 1
          ) {
            currentMessageIndex++;
            newMessage = LOADING_MESSAGES[currentMessageIndex];
          }
        } else if (newProgress >= 30 && newProgress < 90) {
          // Uploading stage
          if (prev.stage === "loading") {
            newStage = "uploading";
            currentStepIndex = 0;
          }

          if (
            newProgress % 12 === 0 &&
            currentStepIndex < UPLOADING_STEPS.length - 1
          ) {
            currentStepIndex++;
          }
          newStep = UPLOADING_STEPS[currentStepIndex];
          newMessage = "Processing your personality swap...";
        } else if (newProgress >= 90) {
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
    }, 150); // Update every 150ms for smooth progress

    return () => clearInterval(progressInterval);
  }, [userRole]);

  if (revealState.stage === "error") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 border border-red-200 dark:border-red-800">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">
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
          <h1 className="text-3xl font-bold mb-4">Preparing Your Reveal</h1>
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
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
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
        <h1 className="text-4xl font-bold mb-4">The Big Reveal!</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Here's how you and your partner see each other through personality
          images. The results might surprise you!
        </p>
      </div>

      {/* Reveal Content Placeholder */}
      <div className="bg-card/60 rounded-xl p-8 border shadow-lg text-center">
        <div className="text-4xl mb-4">🔮</div>
        <h2 className="text-2xl font-semibold mb-4">Coming Soon...</h2>
        <p className="text-muted-foreground mb-6">
          The photo swap functionality will be implemented in the next phase.
          For now, both users have successfully completed their personality
          galleries!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Your Gallery
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {Object.keys(uploadedImages).length} categories completed
            </p>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 border border-pink-200 dark:border-pink-800">
            <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">
              Partner's Gallery
            </h3>
            <p className="text-sm text-pink-600 dark:text-pink-400">
              Ready for swapping
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
