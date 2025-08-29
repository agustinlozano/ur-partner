// Zustand store for managing UI sound effects
import { create } from "zustand";

// Define available sound types
export type SoundSlug = "tap" | "toggle_off" | "ui_feedback" | "sparkles";

export const SOUNDS = {
  tap: "tap",
  toggle_off: "toggle_off",
  ui_feedback: "ui_feedback",
  sparkles: "sparkles",
} as const;

// Sound configuration: URL and default volume for each sound
const SOUND_CONFIG: Record<SoundSlug, { url: string; volume?: number }> = {
  tap: {
    url: process.env.NEXT_PUBLIC_TAP_SOUND || "/sounds/tap.mp3",
    volume: 0.7,
  },
  toggle_off: {
    url: process.env.NEXT_PUBLIC_TOGGLE_OFF_SOUND || "/sounds/toggle_off.mp3",
    volume: 0.8,
  },
  ui_feedback: {
    url:
      process.env.NEXT_PUBLIC_UI_FEEDBACK_SOUND ||
      "/sounds/ui-minimal-feedback.mp3",
    volume: 0.6,
  },
  sparkles: {
    url: process.env.NEXT_PUBLIC_SPARKLES_SOUND || "/sounds/sparkly.wav",
    volume: 0.3,
  },
};

// Store state interface
type SoundsState = {
  // Current selected sound
  selectedSound: SoundSlug;
  // Whether sounds are enabled
  isEnabled: boolean;
  // Map of sound slugs to HTMLAudioElement instances (not reactive)
  audioInstances: Map<SoundSlug, HTMLAudioElement>;
  // Set the selected sound
  setSelectedSound: (sound: SoundSlug) => void;
  // Play a sound (uses selected by default or specified one)
  playSound: (sound?: SoundSlug) => void;
  // Toggle sound enabled/disabled
  toggleSounds: () => void;
  // Set sound enabled/disabled
  setSoundsEnabled: (enabled: boolean) => void;
  // Internal: get or create audio instance for a sound
  _getAudioInstance: (slug: SoundSlug) => HTMLAudioElement;
};

export const useSoundsStore = create<SoundsState>()((set, get) => ({
  // Initial state
  selectedSound: "tap",
  isEnabled: true,
  audioInstances: new Map<SoundSlug, HTMLAudioElement>(),

  // Internal: get or create audio instance for a sound
  _getAudioInstance: (slug) => {
    const state = get();
    let audio = state.audioInstances.get(slug);

    if (!audio) {
      const config = SOUND_CONFIG[slug];
      audio = new Audio(config.url);
      audio.preload = "auto";
      audio.volume = config.volume || 1;

      // Fade-out effect for 'sparkles' between 1.3s and 3s
      if (slug === "sparkles" && audio) {
        // Listener for fade-out
        const fadeHandler = () => {
          if (audio && audio.currentTime >= 1.3 && audio.currentTime <= 3) {
            // Linear volume from 0.3 to 0 between 2s and 3s
            const fadeProgress = (audio.currentTime - 2) / 1; // 0 to 1
            audio.volume = Math.max(0, 0.3 * (1 - fadeProgress));
          } else if (audio && audio.currentTime > 3) {
            audio.volume = 0;
          } else if (audio && audio.currentTime < 2) {
            audio.volume = 0.3;
          }
        };
        // Store handler for later removal
        (audio as any)._fadeHandler = fadeHandler;
        audio.addEventListener("timeupdate", fadeHandler);
        // Reset volume when ended
        audio.addEventListener("ended", () => {
          if (audio) audio.volume = 0.3;
        });
      }

      // Add to instance map
      const instances = new Map(state.audioInstances);
      instances.set(slug, audio);
      set({ audioInstances: instances });
    }

    return audio;
  },

  // Set the selected sound
  setSelectedSound: (sound) => set({ selectedSound: sound }),

  // Play a sound (uses selected by default or specified one)
  playSound: (sound) => {
    const state = get();

    // Do not play if sounds are disabled
    if (!state.isEnabled) return;

    const soundToPlay = sound || state.selectedSound;

    try {
      const audio = state._getAudioInstance(soundToPlay);

      // If already playing, do not overlap
      if (!audio.paused) {
        return;
      }

      // Reset volume and fade for sparkles
      if (soundToPlay === "sparkles") {
        audio.currentTime = 0;
        audio.volume = 0.3;
        // Remove previous fade handler if exists
        if ((audio as any)._fadeHandler) {
          audio.removeEventListener("timeupdate", (audio as any)._fadeHandler);
        }
        // Re-add handler
        const fadeHandler = () => {
          if (audio.currentTime >= 1.3 && audio.currentTime <= 3) {
            const fadeProgress = (audio.currentTime - 2) / 1;
            audio.volume = Math.max(0, 0.3 * (1 - fadeProgress));
          } else if (audio.currentTime > 3) {
            audio.volume = 0;
          } else if (audio.currentTime < 2) {
            audio.volume = 0.3;
          }
        };
        (audio as any)._fadeHandler = fadeHandler;
        audio.addEventListener("timeupdate", fadeHandler);
        audio.addEventListener("ended", () => {
          audio.volume = 0.3;
        });
      }

      audio.play().catch((error) => {
        console.error(`Error playing sound ${soundToPlay}:`, error);
      });
    } catch (error) {
      console.error(`Error playing sound ${soundToPlay}:`, error);
    }
  },

  // Toggle sound enabled/disabled
  toggleSounds: () => set((state) => ({ isEnabled: !state.isEnabled })),

  // Set sound enabled/disabled
  setSoundsEnabled: (enabled) => set({ isEnabled: enabled }),
}));

// Main hook for components to use sound store
export function useSounds() {
  return useSoundsStore();
}

// SOLUCIÓN: Usar selectores individuales en lugar de objetos
export const useSelectedSound = () =>
  useSoundsStore((state) => state.selectedSound);
export const useSetSelectedSound = () =>
  useSoundsStore((state) => state.setSelectedSound);

// Selector: get playSound function
export const useSoundPlayer = () => useSoundsStore((state) => state.playSound);

// SOLUCIÓN: Usar selectores individuales en lugar de objetos
export const useIsSoundEnabled = () =>
  useSoundsStore((state) => state.isEnabled);
export const useToggleSounds = () =>
  useSoundsStore((state) => state.toggleSounds);
export const useSetSoundsEnabled = () =>
  useSoundsStore((state) => state.setSoundsEnabled);
