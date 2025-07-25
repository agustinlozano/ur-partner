"use client";

import { Button } from "@/components/ui/button";
import {
  useToggleSounds,
  useIsSoundEnabled,
  SOUNDS,
  useSoundPlayer,
} from "@/hooks/use-sound-store";

// SoundToggleButton toggles UI sounds on/off using the useSoundStore state
export default function SoundToggleButton() {
  // Get sound enabled state and toggle action from the store
  const isEnabled = useIsSoundEnabled();
  const toggleSounds = useToggleSounds();
  const playSound = useSoundPlayer();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          playSound(SOUNDS.toggle_off);
          toggleSounds();
          if (!isEnabled) {
            playSound(SOUNDS.tap);
          }
        }}
        className="w-10 h-10 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
        title={isEnabled ? "Mute UI sounds" : "Unmute UI sounds"}
      >
        {isEnabled ? (
          // Sound ON icon (waves)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.76V9.51c0-.97.71-1.76 1.59-1.76h7.5z"
            />
          </svg>
        ) : (
          // Sound OFF icon (muted)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.76V9.51c0-.97.71-1.76 1.59-1.76h7.5z"
            />
          </svg>
        )}
      </Button>
    </div>
  );
}
