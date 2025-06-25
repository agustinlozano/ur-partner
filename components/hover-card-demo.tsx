"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function HoverCardDemo({ className }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
  }, []);

  // Intersection Observer para detectar cuando el componente está visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);

        // Auto-play solo en desktop o cuando no es iOS
        if (entry.isIntersecting && videoRef.current && !isPlaying) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

          // En iOS, ser menos agresivo con el autoplay
          if (!isIOS) {
            videoRef.current.play().catch((error) => {
              console.error("Error auto-playing video:", error);
            });
          }
        }
      },
      {
        threshold: isMobile ? 0.3 : 0.5, // Threshold menor en móviles
        rootMargin: "0px 0px -100px 0px", // Margen para activar antes
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isPlaying, isMobile]);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowThumbnail(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowThumbnail(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowThumbnail(true);
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <div className="relative">
        <div
          className={cn(
            "relative bg-card/60 border p-1 group rounded",
            isPlaying && "outline-1 outline-purple-400/25 shadow-2xl"
          )}
        >
          {/* Video container */}
          <div className="relative bg-background/10 overflow-hidden shadow-inner rounded-[0.3rem]">
            <div className="relative aspect-[2454/1554]">
              {/* Video element */}
              <motion.video
                ref={videoRef}
                className="w-full h-full object-cover"
                preload="metadata"
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                loop
                muted
                playsInline // iOS - avoid auto fullscreen
                webkit-playsinline="true" // iOS - for older versions
                controls={false} // avoid native controls
                disablePictureInPicture // disable picture-in-picture
                style={{
                  objectFit: "cover",
                  WebkitTransform: "translateZ(0)", // force hardware acceleration
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isPlaying ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <source
                  src="https://ur-partner.s3.us-east-2.amazonaws.com/assets/hover-card-demo.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </motion.video>

              {/* Thumbnail overlay */}
              <AnimatePresence>
                {showThumbnail && (
                  <motion.div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: "url('/hover-card-demo-thumbnail.webp')",
                    }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>

              {/* Play/Pause overlay - Solo en móviles o cuando no está reproduciendo */}
              {(isMobile || !isPlaying) && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-200 cursor-pointer z-10",
                    isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                  )}
                  onClick={handleVideoClick}
                >
                  <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                    {isPlaying ? (
                      <Pause className="text-white text-2xl" />
                    ) : (
                      <Play className="text-white text-2xl" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {/* <div className="text-center mt-6">
            <h3 className="text-2xl font-bold font-mono mb-2 group-hover:text-gradient transition-colors duration-300">
              Hover Card Interactions
            </h3>
            <p className="text-primary/75 leading-relaxed group-hover:text-primary/90 transition-colors duration-300">
              Watch how users can hover over personality cards to see detailed
              previews with smooth animations
            </p>
          </div> */}

          {/* Decorative element */}
          {/* <div className="absolute bottom-2 left-0 right-0 mx-4 mb-2 rounded h-2 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 group-hover:from-purple-600/40 group-hover:via-indigo-600/40 group-hover:to-purple-600/40 transition-colors duration-300"></div> */}
        </div>

        {/* Status indicator */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                isVisible ? "bg-green-500" : "bg-gray-400"
              )}
            />
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {isPlaying
                ? "Playing"
                : isVisible
                ? isMobile
                  ? "Tap to play"
                  : "Ready to play"
                : "Loading..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
