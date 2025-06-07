"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  mounted: boolean;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isMuted: true,
    volume: 0.05,
    mounted: false,
  });

  const initializeAudio = useCallback(
    (audioSrc: string) => {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.loop = true;
        audioRef.current.volume = state.volume;
        audioRef.current.preload = "auto";

        // Cache the audio file
        audioRef.current.load();
      } else {
        // Update volume if audio already exists
        audioRef.current.volume = state.volume;
      }
    },
    [state.volume]
  );

  const play = useCallback(async () => {
    if (audioRef.current && state.isMuted) {
      try {
        await audioRef.current.play();
        setState((prev) => ({ ...prev, isPlaying: true, isMuted: false }));
      } catch (error) {
        console.log("Audio play failed:", error);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => {
      const newMuted = !prev.isMuted;

      if (audioRef.current) {
        if (newMuted) {
          audioRef.current.pause();
        } else if (prev.isPlaying) {
          audioRef.current.play().catch(console.log);
        }
      }

      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const mount = useCallback(async () => {
    if (audioRef.current) {
      setState((prev) => ({ ...prev, mounted: true }));
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    initializeAudio,
    play,
    pause,
    toggleMute,
    setVolume,
    mount,
  };
}
