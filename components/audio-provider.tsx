"use client";

import { createContext, useContext, useEffect } from "react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { AUDIO_CONFIG } from "@/lib/env";

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  mounted: boolean;
  initializeAudio: (audioSrc: string, fallbackSrc?: string) => Promise<void>;
  mount: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioPlayer = useAudioPlayer();

  // Initialize the audio on mount with S3 URL and fallback
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioPlayer.initializeAudio(
          AUDIO_CONFIG.backgroundMusicUrl,
          AUDIO_CONFIG.fallbackUrl
        );
        console.log("Audio initialization completed");
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initializeAudio();
  }, [audioPlayer.initializeAudio]);

  return (
    <AudioContext.Provider value={audioPlayer}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
