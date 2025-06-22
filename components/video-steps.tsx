"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Pause } from "lucide-react";

interface VideoStep {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  emoji: string;
}

const videoSteps: VideoStep[] = [
  {
    id: 1,
    title: "Create Room",
    description:
      "Start by creating a new room and choosing your role and avatar",
    videoUrl:
      "https://ur-partner.s3.us-east-2.amazonaws.com/assets/1-creating-room.mp4",
    emoji: "🖤",
  },
  {
    id: 2,
    title: "Copy & Share Link",
    description: "Copy the room link to share with your partner",
    videoUrl:
      "https://ur-partner.s3.us-east-2.amazonaws.com/assets/2-copy-link.mp4",
    emoji: "🔗",
  },
  {
    id: 3,
    title: "Join Room",
    description: "Your partner joins using the shared room ID",
    videoUrl: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/3-join.mp4",
    emoji: "🤍",
  },
];

const previewImages = ["/create.webp", "/share.webp", "/join.webp"];

export default function VideoSteps() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const handleVideoClick = async (stepId: number) => {
    // Pause all other videos first
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video && parseInt(id) !== stepId && !video.paused) {
        video.pause();
      }
    });

    if (activeVideo === stepId) {
      // If this video is currently playing, pause it
      const currentVideo = videoRefs.current[stepId];
      if (currentVideo && !currentVideo.paused) {
        currentVideo.pause();
      }
      setActiveVideo(null);
    } else {
      // Start playing this video (will trigger expansion)
      setActiveVideo(stepId);

      // Wait a bit for the DOM to update with the video element
      setTimeout(async () => {
        const clickedVideo = videoRefs.current[stepId];
        if (clickedVideo) {
          try {
            await clickedVideo.play();
          } catch (error) {
            console.error("Error playing video:", error);
            setActiveVideo(null);
          }
        }
      }, 100);
    }
  };

  return (
    <div className="mt-16 max-w-8xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold font-mono mb-4">See How It Works</h2>
        <p className="text-xl text-primary/75 max-w-2xl text-pretty mx-auto">
          Watch these quick demos to see how easy it is to create and join rooms
          with your partner
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 px-4">
        {videoSteps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "relative bg-card/60 rounded-2xl shadow-lg border p-2 group",
              activeVideo === step.id &&
                "outline-4 outline-purple-400/25 shadow-2xl"
            )}
          >
            {/* Step number */}
            <div className="absolute -top-3 -left-3 size-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {step.id}
            </div>

            {/* Video container */}
            <div className="grow relative mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner">
              <div
                className={cn(
                  "relative transition-all duration-700 ease-in-out",
                  activeVideo === step.id
                    ? "aspect-[640/900]" // Video aspect ratio when playing
                    : "aspect-[1080/542]" // Preview image aspect ratio when not playing
                )}
              >
                {/* Preview image when not playing */}
                {activeVideo !== step.id && (
                  <div className="absolute inset-0">
                    <img
                      src={previewImages[step.id - 1]}
                      alt={step.title}
                      className="w-full h-full object-cover opacity-75"
                    />
                    {/* Emoji overlay */}
                    <div
                      className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-black/30 transition-colors duration-300 cursor-pointer"
                      onClick={() => handleVideoClick(step.id)}
                    >
                      <div className="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                        {step.emoji}
                      </div>
                    </div>
                  </div>
                )}

                {/* Video when playing */}
                {activeVideo === step.id && (
                  <video
                    ref={(el) => {
                      videoRefs.current[step.id] = el;
                    }}
                    className="w-full h-full object-cover cursor-pointer"
                    preload="metadata"
                    onPlay={() => setActiveVideo(step.id)}
                    onPause={() => setActiveVideo(null)}
                    onEnded={() => setActiveVideo(null)}
                    onClick={() => handleVideoClick(step.id)}
                    autoPlay
                  >
                    <source src={step.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}

                {/* Play/Pause indicator when video is active */}
                {activeVideo === step.id && (
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    onClick={() => handleVideoClick(step.id)}
                  >
                    <div className="bg-black/50 rounded-full p-3">
                      <div className="text-white text-2xl">
                        <Pause />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step content */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold font-mono mb-2 group-hover:text-gradient transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-primary/75 text-sm leading-relaxed group-hover:text-primary/90 transition-colors duration-300">
                {step.description}
              </p>
            </div>

            {/* Decorative element */}
            <div className="absolute bottom-2 left-0 right-0 mx-3 mb-1 rounded h-2 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 group-hover:from-purple-600/40 group-hover:via-indigo-600/40 group-hover:to-purple-600/40 transition-colors duration-300"></div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
          <span>💡</span>
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Each video shows the actual interface and interactions
          </span>
        </div>

        <div className="text-center max-w-2xl mx-auto my-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-red-400 bg-red-200 dark:bg-red-900/20 dark:border-red-800">
            <span>💡</span>
            <p className="text-xs mx-auto py-2 text-primary/75">
              Rooms expire after 2.5 hours for privacy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
