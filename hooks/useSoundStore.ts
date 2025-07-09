import { create } from "zustand";

// All valid sound slugs
export type SoundSlug = "tap" | "toggle_off" | "ui_feedback";

// Sound slug constants (for autocomplete and type safety)
export const SOUNDS = {
  tap: "tap",
  toggle_off: "toggle_off",
  ui_feedback: "ui_feedback",
} as const;

// Sound configuration: URL and optional volume for each sound
const SOUND_CONFIG: Record<SoundSlug, { url: string; volume?: number }> = {
  tap: {
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/sounds/tap.wav",
    volume: 0.7,
  },
  toggle_off: {
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/sounds/toggle_off.wav",
    volume: 0.6,
  },
  ui_feedback: {
    url: "https://ur-partner.s3.us-east-2.amazonaws.com/assets/sounds/ui-minimal-feedback.wav",
    volume: 0.6,
  },
};

// Zustand store state and actions for sound management
interface SoundsState {
  // State
  selectedSound: SoundSlug; // Currently selected sound
  isEnabled: boolean; // Whether sounds are enabled

  // Audio instances (not reactive)
  audioInstances: Map<SoundSlug, HTMLAudioElement>;

  // Actions
  setSelectedSound: (sound: SoundSlug) => void;
  playSound: (sound?: SoundSlug) => void;
  toggleSounds: () => void;
  setSoundsEnabled: (enabled: boolean) => void;

  // Internal action
  _getAudioInstance: (slug: SoundSlug) => HTMLAudioElement;
}

export const useSoundsStore = create<SoundsState>()((set, get) => ({
  // Initial state
  selectedSound: "tap",
  isEnabled: true,
  audioInstances: new Map<SoundSlug, HTMLAudioElement>(),

  // Internal: create or get an audio instance for a given sound slug
  _getAudioInstance: (slug) => {
    const state = get();
    let audio = state.audioInstances.get(slug);

    if (!audio) {
      const config = SOUND_CONFIG[slug];
      audio = new Audio(config.url);
      audio.preload = "auto";
      audio.volume = config.volume || 1;

      // Add to the map of instances
      const instances = new Map(state.audioInstances);
      instances.set(slug, audio);
      set({ audioInstances: instances });
    }

    return audio;
  },

  // Set the selected sound
  setSelectedSound: (sound) => set({ selectedSound: sound }),

  // Play a sound (uses selected by default, or the one specified)
  playSound: (sound) => {
    const state = get();

    // Do not play if sounds are disabled
    if (!state.isEnabled) return;

    const soundToPlay = sound || state.selectedSound;

    try {
      const audio = state._getAudioInstance(soundToPlay);

      // Reset if already playing
      if (!audio.paused) {
        audio.currentTime = 0;
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

  // Explicitly enable or disable sounds
  setSoundsEnabled: (enabled) => set({ isEnabled: enabled }),
}));

// Main hook for using sounds in components
export function useSounds() {
  return useSoundsStore();
}

// Selector: get selected sound and setter (for UI, avoids unnecessary rerenders)
export const useSoundSelector = () =>
  useSoundsStore((state) => ({
    selectedSound: state.selectedSound,
    setSelectedSound: state.setSelectedSound,
  }));

// Selector: get only the playSound function
export const useSoundPlayer = () => useSoundsStore((state) => state.playSound);

// Selector: get sound enabled state and toggles (for UI switches)
export const useSoundToggle = () =>
  useSoundsStore((state) => ({
    isEnabled: state.isEnabled,
    toggleSounds: state.toggleSounds,
    setSoundsEnabled: state.setSoundsEnabled,
  }));

// List of available sounds (for UI selectors, dropdowns, etc)
export const AVAILABLE_SOUNDS: { slug: SoundSlug; label: string }[] = [
  { slug: "tap", label: "Tap" },
  { slug: "toggle_off", label: "Toggle Off" },
  { slug: "ui_feedback", label: "UI Feedback" },
];
