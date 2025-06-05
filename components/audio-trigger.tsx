"use client";

import { useEffect } from "react";
import { useAudio } from "@/components/audio-provider";

interface AudioTriggerProps {
  shouldPlay?: boolean;
}

export default function AudioTrigger({
  shouldPlay = false,
}: AudioTriggerProps) {
  const { play } = useAudio();

  useEffect(() => {
    if (shouldPlay) {
      // Add a small delay to ensure smooth user experience
      const timer = setTimeout(() => {
        play().catch(console.log);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldPlay, play]);

  return null; // This component doesn't render anything
}
