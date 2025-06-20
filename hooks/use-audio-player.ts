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
    volume: 0.2,
    mounted: false,
  });

  const initializeAudio = useCallback(
    (audioSrc: string, fallbackSrc?: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.loop = true;
          audioRef.current.volume = state.volume;
          audioRef.current.preload = "auto";

          // Handle successful load
          const handleCanPlay = () => {
            console.log(`Audio loaded successfully from: ${audioSrc}`);
            if (audioRef.current) {
              audioRef.current.removeEventListener("canplay", handleCanPlay);
              audioRef.current.removeEventListener("error", handleError);
            }
            resolve();
          };

          // Handle load error
          const handleError = (error: Event) => {
            console.warn(`Failed to load audio from: ${audioSrc}`, error);

            if (audioRef.current) {
              audioRef.current.removeEventListener("canplay", handleCanPlay);
              audioRef.current.removeEventListener("error", handleError);
            }

            // Try fallback if available
            if (fallbackSrc && audioSrc !== fallbackSrc) {
              console.log(`Attempting fallback: ${fallbackSrc}`);
              audioRef.current = null; // Reset audio ref
              initializeAudio(fallbackSrc).then(resolve).catch(reject);
              return;
            }

            reject(new Error(`Failed to load audio from ${audioSrc}`));
          };

          // Set up event listeners
          audioRef.current.addEventListener("canplay", handleCanPlay, {
            once: true,
          });
          audioRef.current.addEventListener("error", handleError, {
            once: true,
          });

          // Start loading
          audioRef.current.src = audioSrc;
          audioRef.current.load();
        } else {
          // Update volume if audio already exists
          audioRef.current.volume = state.volume;
          resolve();
        }
      });
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
  }, [state.isMuted]);

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
