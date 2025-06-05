"use client";

import { createContext, useContext, useEffect } from "react";
import { useAudioPlayer } from "@/hooks/use-audio-player";

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  initializeAudio: (audioSrc: string) => void;
  play: () => Promise<void>;
  pause: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioPlayer = useAudioPlayer();

  // Initialize the audio on mount and cache it
  useEffect(() => {
    audioPlayer.initializeAudio("/uplift-piano-riff.wav");
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
