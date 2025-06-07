"use client";

import { useEffect } from "react";
import { useAudio } from "@/components/audio-provider";

interface AudioTriggerProps {
  shouldPlay?: boolean;
}

export default function AudioTrigger({
  shouldPlay = false,
}: AudioTriggerProps) {
  const { mount } = useAudio();

  useEffect(() => {
    if (shouldPlay) {
      // Add a small delay to ensure smooth user experience
      const timer = setTimeout(() => mount(), 500);

      return () => clearTimeout(timer);
    }
  }, [shouldPlay, mount]);

  return null;
}
